use std::borrow::Borrow;
use std::net::SocketAddr;
use std::sync::Arc;
use std::sync::Mutex;

use futures_util::stream::StreamExt;
use futures_util::SinkExt;
use tokio::net::TcpListener;
use tokio::net::TcpStream;

#[derive(Default)]
struct State {
    owner: Option<String>,
    winner: bool,
}

#[derive(Default)]
struct Grid {
    grid: [[State; 10]; 10],
}

type GridState = Arc<Mutex<Grid>>;

#[tokio::main]
async fn main() {
    let grid: GridState = Default::default();

    let listener = TcpListener::bind("0.0.0.0:8081")
        .await
        .expect("Failed to bind");

    while let Ok((stream, addr)) = listener.accept().await {
        tokio::spawn(handle_connection(Arc::clone(&grid), stream, addr));
    }
}

async fn handle_connection(grid: GridState, stream: TcpStream, addr: SocketAddr) {
    eprintln!("Connection from {}", addr);

    let mut ws_stream = tokio_tungstenite::accept_async(stream)
        .await
        .expect("Failed to create ws stream");

    while let Some(msg) = ws_stream.next().await {
        let Ok(msg) = msg else { break; };
        let Ok(text) = msg.into_text() else { break; };

        if text.is_empty() {
            break;
        };

        match text.as_str() {
            "FLYNN_MODE" => {
                let mut glock = grid.lock().expect("Failed to acquire grid lock");
                glock.grid = Default::default();
                eprintln!("Resetting board");
            }

            "GET" => {
                let mut json = String::new();

                {
                    let glock = grid.lock().expect("Failed to acquire grid lock");

                    let grid: &[[State; 10]; 10] = glock.grid.borrow();

                    print_grid(grid, &mut json);
                }

                ws_stream
                    .send(json.into())
                    .await
                    .expect("Failed to send GET");
            }

            _ => {
                let [kind, row, col, val] = text.split(':').collect::<Vec<&str>>()[..] else {
                    eprintln!("Split wrong size");
                    continue;
                };

                let mut abort = false;

                {
                    let mut glock = grid.lock().expect("Failed to aquire grid lock");

                    let row: usize = row.parse().expect("Failed to parse row");
                    let col: usize = col.parse().expect("Failed to parse col");

                    match kind {
                        "CLAIM" => {
                            if glock.grid[row][col].owner.is_none() {
                                glock.grid[row][col].owner = Some(val.into());
                            } else {
                                abort = true;
                            }
                        }

                        "UNSET" => {
                            if glock.grid[row][col].owner == Some(val.into()) {
                                glock.grid[row][col].owner = None;
                            } else {
                                abort = true;
                            }
                        }

                        "WIN" => {
                            glock.grid[row][col].winner =
                                val.parse::<bool>().expect("Failed to parse winner");
                        }

                        e => {
                            eprintln!("Got unknown command {e}");
                        }
                    }
                }

                ws_stream
                    .send((if abort { "rectify" } else { "games" }).into())
                    .await
                    .expect("failed to send response");
            }
        }
    }

    eprintln!("Connection ended with {}", addr);
}

fn print_grid(grid: &[[State; 10]; 10], s: &mut String) {
    s.push('[');

    for row in &grid[..grid.len() - 1] {
        print_row(row, s);
        s.push(',');
    }

    print_row(grid.last().unwrap(), s);

    s.push(']');
}

fn print_row(row: &[State; 10], s: &mut String) {
    s.push('[');

    for item in &row[..row.len() - 1] {
        print_state(item, s);
        s.push(',');
    }

    print_state(row.last().unwrap(), s);

    s.push_str("]");
}

fn print_state(item: &State, s: &mut String) {
    let owner_str = if let Some(ref owner) = item.owner {
        format!("\"{owner}\"")
    } else {
        "null".into()
    };

    let winner_str = item.winner;

    s.push_str(&format!(
        "{{ \"owner\": {owner_str}, \"winner\": {winner_str} }}"
    ));
}
