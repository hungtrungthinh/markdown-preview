use axum::{
    extract::Json,
    http::{Method, StatusCode},
    response::{Html, Json as JsonResponse},
    routing::{get, post},
    Router,
};
use pulldown_cmark::{html, Options, Parser};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

#[derive(Deserialize)]
struct MarkdownRequest {
    content: String,
    theme: Option<String>,
}

#[derive(Serialize)]
struct MarkdownResponse {
    html: String,
    error: Option<String>,
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    service: String,
}

async fn convert_markdown(Json(payload): Json<MarkdownRequest>) -> JsonResponse<MarkdownResponse> {
    let options = Options::all();
    let parser = Parser::new_ext(&payload.content, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    // Apply theme-specific styling if provided
    let html_with_theme = if let Some(theme) = payload.theme {
        format!(
            r#"<div class="markdown-content theme-{}">{}</div>"#,
            theme, html_output
        )
    } else {
        format!(r#"<div class="markdown-content">{}</div>"#, html_output)
    };

    JsonResponse(MarkdownResponse {
        html: html_with_theme,
        error: None,
    })
}

async fn health_check() -> JsonResponse<HealthResponse> {
    JsonResponse(HealthResponse {
        status: "healthy".to_string(),
        service: "markdown-preview-backend".to_string(),
    })
}

#[tokio::main]
async fn main() {
    // Initialize logging
    env_logger::init();

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any)
        .allow_headers(Any);

    // Create router
    let app = Router::new()
        .route("/api/convert", post(convert_markdown))
        .route("/health", get(health_check))
        .nest_service("/", ServeDir::new("frontend/.next/static"))
        .layer(cors);

    // Bind to address
    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    println!("🚀 Markdown Preview Backend starting on {}", addr);

    // Start server
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
