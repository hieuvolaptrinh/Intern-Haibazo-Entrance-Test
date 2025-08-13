import { useState, useEffect, useRef, useCallback } from "react";
import Ball from "./components/Ball";

function App() {
  const [pointsInput, setPointsInput] = useState(10);
  const [balls, setBalls] = useState([]);
  const [time, setTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false); // Game có đang chạy không
  const [nextBallToClick, setNextBallToClick] = useState(1); // Số bóng tiếp theo cần click
  const [gameCompleted, setGameCompleted] = useState(false); // Game đã hoàn thành chưa
  const [gameOver, setGameOver] = useState(false); // Game kết thúc do click sai bóng
  const [autoPlay, setAutoPlay] = useState(false); // Chế độ tự động chơi
  const [gameStarted, setGameStarted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [animatingBalls, setAnimatingBalls] = useState(new Set()); // Theo dõi balls đang animation

  // Các ref để quản lý timer và auto play
  const timerRef = useRef(null);
  const autoPlayRef = useRef(null);
  const ballRefs = useRef({});
  const GAME_AREA_WIDTH = 600;
  const GAME_AREA_HEIGHT = 500;
  const BALL_SIZE = 40;

  // Tạo vị trí ngẫu nhiên cho bóng trong vùng chơi
  const generateRandomPosition = useCallback(
    (existingBalls = []) => {
      let attempts = 0;
      let x, y;

      do {
        x = Math.random() * (GAME_AREA_WIDTH - BALL_SIZE);
        y = Math.random() * (GAME_AREA_HEIGHT - BALL_SIZE);
        attempts++;
      } while (
        attempts < 50 &&
        existingBalls.some((ball) => {
          const distance = Math.sqrt(
            Math.pow(ball.x - x, 2) + Math.pow(ball.y - y, 2)
          );
          return distance < BALL_SIZE; // Nếu khoảng cách nhỏ hơn kích thước bóng thì bị trùng
        })
      );

      return { x, y };
    },
    [GAME_AREA_WIDTH, GAME_AREA_HEIGHT, BALL_SIZE]
  );

  // Khởi tạo tất cả các bóng với vị trí ngẫu nhiên
  const initializeBalls = useCallback(
    (count) => {
      const newBalls = [];

      for (let i = 1; i <= count; i++) {
        const position = generateRandomPosition(newBalls);
        newBalls.push({
          id: i,
          label: i,
          x: position.x,
          y: position.y,
        });
      }

      setBalls(newBalls);
      ballRefs.current = {};
    },
    [generateRandomPosition]
  );

  // Ref để theo dõi balls đang được xử lý (tránh double-click)
  const processingBalls = useRef(new Set());

  const handleAnimationComplete = useCallback((ballId) => {
    // Xóa ball khỏi danh sách sau khi animation hoàn thành
    setBalls((current) => current.filter((b) => b.id !== ballId));
    setAnimatingBalls((current) => {
      const newSet = new Set(current);
      newSet.delete(ballId);
      return newSet;
    });
  }, []);

  // Xử lý khi người chơi click vào bóng
  const handleBallClick = useCallback(
    (ballId) => {
      // Kiểm tra xem ball này đã đang được xử lý chưa
      if (processingBalls.current.has(ballId)) {
        return; // Nếu đang xử lý thì bỏ qua
      }

      const ball = balls.find((b) => b.id === ballId); // Tìm bóng được click
      if (!ball || !isGameActive) return; // Nếu không tìm thấy bóng hoặc game không hoạt động thì thoát

      processingBalls.current.add(ballId);

      if (ball.label !== nextBallToClick) {
        setGameOver(true);
        setIsGameActive(false);
        setAutoPlay(false);

        processingBalls.current.clear();
        return;
      }

      setNextBallToClick((current) => current + 1);
      setAnimatingBalls((current) => {
        const newSet = new Set(current);
        newSet.add(ballId);
        return newSet;
      });

      // Xóa khỏi processing set
      processingBalls.current.delete(ballId);
    },
    [nextBallToClick, balls, isGameActive]
  );

  // Bắt đầu game mới
  const startGame = useCallback(() => {
    if (pointsInput === 0) {
      // Nếu số bóng = 0 thì hiển thị "ALL CLEARED" ngay lập tức
      setGameCompleted(true);
      setIsGameActive(false);
      setGameStarted(true);
      setIsInitialized(true);
      return;
    }

    clearInterval(timerRef.current);
    clearInterval(autoPlayRef.current);

    // Reset processing balls set
    processingBalls.current.clear();

    // Khởi tạo game với số bóng được chọn
    initializeBalls(pointsInput);
    setTime(0); // Reset thời gian về 0
    setNextBallToClick(1);
    setGameCompleted(false);
    setGameOver(false);
    setIsGameActive(true);
    setGameStarted(true);
    setIsInitialized(true);
    setAnimatingBalls(new Set());
  }, [pointsInput, initializeBalls]);

  // Restart game - quay về trạng thái ban đầu
  const restartGame = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(autoPlayRef.current);
    setBalls([]);
    setTime(0);
    setNextBallToClick(1);
    setGameCompleted(false);
    setGameOver(false);
    setIsGameActive(false);
    setGameStarted(false);
    setAutoPlay(false);
    setIsInitialized(false);
    setAnimatingBalls(new Set());
    processingBalls.current.clear();
  }, []);

  useEffect(() => {
    if (isGameActive) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 0.01);
      }, 10);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isGameActive]);

  // Chế độ tự động chơi - tự động click các bóng theo thứ tự với hiệu ứng
  useEffect(() => {
    if (autoPlay && isGameActive && balls.length > 0) {
      // Tìm bóng có số thứ tự nhỏ nhất trong danh sách balls hiện tại
      const sortedBalls = balls.sort((a, b) => a.label - b.label);
      const ballToClick = sortedBalls[0];

      if (ballToClick) {
        // Đợi 1 giây rồi tự động click bóng đó
        autoPlayRef.current = setTimeout(() => {
          if (autoPlay && isGameActive) {
            const currentBalls = balls;
            const stillExists = currentBalls.find(
              (b) => b.id === ballToClick.id
            );

            if (stillExists) {
              const ballRef = ballRefs.current[ballToClick.id];
              if (ballRef && ballRef.triggerClick) {
                ballRef.triggerClick(); // Gọi handleClick của Ball component để có đầy đủ hiệu ứng
              } else {
                handleBallClick(ballToClick.id);
              }
            }
          }
        }, 1000); // Tăng delay lên 1 giây để chậm lại
      }
    } else {
      clearTimeout(autoPlayRef.current); // Dừng auto play
    }

    return () => clearTimeout(autoPlayRef.current);
  }, [autoPlay, isGameActive, balls, handleBallClick]);

  // Kiểm tra xem game đã hoàn thành chưa
  useEffect(() => {
    if (
      isGameActive &&
      balls.length === 0 &&
      animatingBalls.size === 0 &&
      pointsInput > 0
    ) {
      setGameCompleted(true);
      setIsGameActive(false);
      setAutoPlay(false);
    }
  }, [balls.length, animatingBalls.size, isGameActive, pointsInput]);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            height: "auto",
            width: "calc(100vh - 200px)",
            maxWidth: "800px",
          }}
        >
          <h1
            style={{
              color: gameCompleted ? "green" : gameOver ? "red" : "black",
            }}
          >
            {gameCompleted
              ? "ALL CLEARED"
              : gameOver
              ? "GAME OVER"
              : "LET'S PLAY"}
          </h1>

          <div style={{ marginBottom: "10px" }}>
            <label>
              Points:
              <input
                type="number"
                value={pointsInput}
                onChange={(e) =>
                  setPointsInput(Math.max(0, parseInt(e.target.value) || 0))
                }
                min="0"
                max="100"
                style={{ marginLeft: "10px", width: "60px" }}
                disabled={isGameActive}
              />
            </label>
          </div>

          {/* Hiển thị thông tin chỉ khi game đã được khởi tạo */}
          {isInitialized && (
            <div style={{ marginBottom: "10px" }}>
              <strong>Time: {time.toFixed(2)}s</strong>{" "}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {!gameStarted || gameCompleted || gameOver ? (
              <button
                onClick={startGame}
                disabled={!isInitialized && pointsInput === 0}
              >
                Start
              </button>
            ) : (
              <button onClick={restartGame}>Restart</button>
            )}

            {/* Nút Auto Play - chỉ hiển thị khi game đang chạy */}
            {isGameActive && (
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                style={{
                  backgroundColor: autoPlay ? "#4CAF50" : "#f0f0f0",
                  color: autoPlay ? "white" : "black",
                }}
              >
                Auto Play {autoPlay ? "ON" : "OFF"}
              </button>
            )}
          </div>

          <div
            style={{
              height: GAME_AREA_HEIGHT,
              width: GAME_AREA_WIDTH,
              border: "1px solid black",
              position: "relative",
              backgroundColor: "#f9f9f9",
            }}
          >
            {/* Chỉ hiển thị balls khi game đã được khởi tạo */}
            {isInitialized &&
              balls.map((ball) => (
                <Ball
                  key={ball.id}
                  ref={(ref) => {
                    if (ref) {
                      ballRefs.current[ball.id] = ref;
                    }
                  }}
                  id={ball.id}
                  label={ball.label}
                  x={ball.x}
                  y={ball.y}
                  onClick={handleBallClick}
                  onAnimationComplete={handleAnimationComplete}
                  size={BALL_SIZE}
                />
              ))}

            {!isInitialized && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#666",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                Enter number of balls and click Start
              </div>
            )}

            {gameCompleted && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: "green",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                ALL CLEARED
              </div>
            )}
          </div>

          {isGameActive && (
            <div style={{ marginTop: "10px" }}>
              <p>
                Next ball to click: <strong>{nextBallToClick}</strong>
              </p>
              <p>
                Remaining balls:{" "}
                <strong>{balls.length + animatingBalls.size}</strong>
              </p>
            </div>
          )}

          {gameOver && (
            <div
              style={{ marginTop: "10px", color: "red", fontWeight: "bold" }}
            >
              <p>You clicked the wrong ball! Game Over!</p>
              <p>
                You needed to click ball <strong>{nextBallToClick}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
