use axum::{
    extract::{DefaultBodyLimit, Json},
    http::Method,
    response::Json as JsonResponse,
    routing::{get, post},
    Router,
};
use log::{error, info, warn};
use pulldown_cmark::{html, Options, Parser};
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use std::net::SocketAddr;
use std::time::{SystemTime, UNIX_EPOCH};
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

// Logging function to write to file
fn write_log(level: &str, message: &str) {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let log_entry = format!(
        "[{}] [{}] {}\n",
        chrono::DateTime::from_timestamp(timestamp as i64, 0)
            .unwrap()
            .format("%Y-%m-%d %H:%M:%S"),
        level,
        message
    );

    // Write to log file
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open("logs/markdown-backend.log")
    {
        if let Err(e) = file.write_all(log_entry.as_bytes()) {
            eprintln!("Failed to write to log file: {}", e);
        }
    } else {
        eprintln!("Failed to open log file");
    }
}

async fn convert_markdown(Json(payload): Json<MarkdownRequest>) -> JsonResponse<MarkdownResponse> {
    let start_time = SystemTime::now();
    let content_length = payload.content.len();
    let theme = payload.theme.as_deref().unwrap_or("default");

    // Check file size limit (15MB)
    if content_length > 15 * 1024 * 1024 {
        write_log(
            "ERROR",
            &format!("File too large: {} bytes (max 15MB)", content_length),
        );
        return JsonResponse(MarkdownResponse {
            html: format!("<div class='error'><p style='color: red; font-weight: bold;'>Error: File too large ({:.1}MB). Maximum size is 15MB.</p></div>", content_length as f64 / 1024.0 / 1024.0),
            error: Some("File too large".to_string()),
        });
    }

    // Log request start
    write_log(
        "INFO",
        &format!(
            "Markdown conversion started - Length: {} chars, Theme: {}",
            content_length, theme
        ),
    );

    let options = Options::all();
    let parser = Parser::new_ext(&payload.content, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    // Apply theme-specific styling if provided
    let html_with_theme = if let Some(ref theme) = payload.theme {
        format!(
            r#"<div class="markdown-content theme-{}">{}</div>"#,
            theme, html_output
        )
    } else {
        format!(r#"<div class="markdown-content">{}</div>"#, html_output)
    };

    // Calculate processing time
    let processing_time = start_time.elapsed().unwrap().as_millis();
    let html_length = html_with_theme.len();

    // Log successful conversion
    write_log(
        "INFO",
        &format!(
            "Markdown conversion completed - Input: {} chars, Output: {} chars, Time: {}ms, Theme: {}",
            content_length, html_length, processing_time, theme
        ),
    );

    JsonResponse(MarkdownResponse {
        html: html_with_theme,
        error: None,
    })
}

async fn health_check() -> JsonResponse<HealthResponse> {
    write_log("INFO", "Health check requested");

    JsonResponse(HealthResponse {
        status: "healthy".to_string(),
        service: "markdown-preview-backend".to_string(),
    })
}

#[tokio::main]
async fn main() {
    // Create logs directory if it doesn't exist
    std::fs::create_dir_all("logs").unwrap_or_else(|e| {
        eprintln!("Failed to create logs directory: {}", e);
    });

    // Initialize logging
    env_logger::init();

    // Log server startup
    write_log("INFO", "Markdown Preview Backend starting up");

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
        .layer(cors)
        .layer(DefaultBodyLimit::max(16 * 1024 * 1024)); // 16MB limit

    // Bind to address
    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    println!("🚀 Markdown Preview Backend starting on {}", addr);
    write_log("INFO", &format!("Server bound to address: {}", addr));

    // Start server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    write_log(
        "INFO",
        "Server started successfully and listening for connections",
    );
    axum::serve(listener, app).await.unwrap();
}
