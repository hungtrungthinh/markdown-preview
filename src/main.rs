use axum::{
    extract::Json,
    http::{Method, StatusCode},
    response::Html,
    routing::{get, post},
    Router,
};
use pulldown_cmark::{html, Options, Parser};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Debug, Deserialize)]
struct MarkdownRequest {
    content: String,
    theme: Option<String>,
}

#[derive(Debug, Serialize)]
struct MarkdownResponse {
    html: String,
    error: Option<String>,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any)
        .allow_headers(Any);

    // Build our application with a route
    let app = Router::new()
        .route("/", get(root))
        .route("/api/convert", post(convert_markdown))
        .route("/health", get(health_check))
        .layer(cors);

    // Run it
    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    tracing::info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> Html<&'static str> {
    Html("<h1>Markdown Preview Backend</h1><p>API is running!</p>")
}

async fn health_check() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::OK,
        Json(serde_json::json!({
            "status": "healthy",
            "service": "markdown-preview-backend"
        })),
    )
}

async fn convert_markdown(
    Json(payload): Json<MarkdownRequest>,
) -> (StatusCode, Json<MarkdownResponse>) {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES);

    let parser = Parser::new_ext(&payload.content, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    let response = MarkdownResponse {
        html: html_output,
        error: None,
    };
    (StatusCode::OK, Json(response))
}
