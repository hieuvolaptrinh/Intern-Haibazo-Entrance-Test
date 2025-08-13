import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";

const Ball = forwardRef(
  ({ id, label, x, y, onClick, onAnimationComplete, size = 40 }, ref) => {
    // State quản lý animation
    const [isAnimating, setIsAnimating] = useState(false); // Có đang chạy animation không
    const [currentCountdown, setCurrentCountdown] = useState(3); // Hiển thị thời gian đếm ngược hiện tại

    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);

    useImperativeHandle(ref, () => ({
      triggerClick: handleClick,
    }));

    const handleClick = () => {
      if (isAnimating) return;

      onClick(id);

      setIsAnimating(true); // Bắt đầu animation
      startTimeRef.current = Date.now(); // Lưu thời điểm bắt đầu
      setCurrentCountdown(3); // Bắt đầu từ 3 giây

      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const remaining = Math.max(0, 3 - elapsed);

        setCurrentCountdown(remaining);

        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          setIsAnimating(false); // Reset animation state khi countdown kết thúc
          // Thông báo cho parent component rằng animation đã hoàn thành
          if (onAnimationComplete) {
            onAnimationComplete(id);
          }
        }
      }, 10);
    };

    useEffect(() => {
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, []);

    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`Ball number ${label}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{
          position: "absolute",
          left: `${x}px`,
          top: `${y}px`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%", // Tạo hình tròn
          border: "2px solid #ff0000ff", // Viền đỏ
          backgroundColor: isAnimating ? "#ff0000" : "#fff", // Nền đỏ khi animation, trắng khi bình thường
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          userSelect: "none", // Không cho phép select text
          transform: "scale(1)", // Không thay đổi kích thước
          opacity: isAnimating ? 0.3 : 1, // Mờ dần khi animation (từ 1 về 0.3 trong 3 giây)
          transition: "opacity 3s ease-out, background-color 0.3s ease-out", // Hiệu ứng chuyển đổi
          outline: "none",
          color: isAnimating ? "#fff" : "#000", // Chữ trắng khi animation, đen khi bình thường
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = "0 0 0 2px #007bff";
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = "none";
        }}
      >
        {isAnimating ? currentCountdown.toFixed(2) : label}{" "}
      </div>
    );
  }
);

export default Ball;
