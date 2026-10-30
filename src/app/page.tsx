"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  MapPin, 
  Heart, 
  Send, 
  Share2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  ExternalLink, 
  Check, 
  Lock, 
  Unlock, 
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  KeyRound,
  Music2
} from "lucide-react";
import confetti from "canvas-confetti";
import { addGuestInvitation, subscribeToGuests, GuestEntry } from "@/lib/firebase";

// Default photos shown to everyone (anh 1, 2, 3)
const DEFAULT_PHOTOS = [
  { src: "/anh3.jpg", title: "Nụ cười rạng rỡ", desc: "Khoảnh khắc đón chào tương lai tươi sáng" },
  { src: "/anh1.jpg", title: "Tân Cử Nhân FPT", desc: "Ready for Global Career - Tự hào ngày trao bằng" },
  { src: "/anh2.jpg", title: "Cột mốc thanh xuân", desc: "Dấu ấn rực rỡ sau những năm tháng nỗ lực" },
];

// Special photos unlocked when entering 'Vy Kha' or 'Kha' AND pass '1611'
const KHA_SPECIAL_PHOTOS = [
  { src: "/kha.jpg", title: "Đôi bạn cùng tiến 🎓", desc: "Khoảnh khắc tuyệt đẹp ngày tốt nghiệp cùng Kha" },
  { src: "/kha1.jpg", title: "Khoảnh khắc nhí nhố", desc: "Thanh xuân đẹp nhất là khi có bạn đồng hành" },
  { src: "/kha2.jpg", title: "Góc sân trường quen", desc: "Bao kỷ niệm dưới mái trường FPT University" },
  { src: "/kha4.jpg", title: "Rạng rỡ ngày tốt nghiệp", desc: "Chạm tay vào ước mơ cùng người bạn đặc biệt" },
  { src: "/kha5.jpg", title: "Bên nhau chặng đường dài", desc: "Sát cánh suốt những năm tháng thanh xuân đại học" },
  { src: "/kha6.jpg", title: "Ánh mắt tự hào", desc: "Cùng bước tiếp trên con đường tương lai rộng mở" },
  { src: "/kha7.jpg", title: "Đồng hành và gắn kết", desc: "Khép lại giảng đường, mãi là tri kỷ của nhau" },
  { src: "/kha8.jpg", title: "Mùa hoa tốt nghiệp", desc: "Ngập tràn hy vọng, may mắn và niềm vui" },
  { src: "/anh3.jpg", title: "Nụ cười tươi tắn", desc: "Khoảnh khắc lưu dấu thanh xuân rực rỡ" },
  { src: "/anh1.jpg", title: "Tấm bằng cử nhân", desc: "Thành quả sau bao năm tháng cố gắng" },
  { src: "/anh2.jpg", title: "Tự hào tốt nghiệp", desc: "Cột mốc thiêng liêng và đáng nhớ" },
];

const RELATIONS = [
  "Bạn bè thân thiết",
  "Bạn cùng trường FPT",
  "Gia đình & Người thân",
  "Thầy cô & Tiền bối",
  "Đồng nghiệp",
  "Khác"
];

// Official graduation time: Nov 07, 2026, 13:00 (Ca 3)
const GRADUATION_DATE = new Date("2026-11-07T13:00:00+07:00").getTime();

// Secret passcode required for Vy Kha (Strictly verified, no hint in UI)
const KHA_PASSCODE = "1611";
// Nhạc nền thuần âm thanh HTML5 (nhactotnghiep.mp3 & nhacvykha.mp3)
const DEFAULT_AUDIO_SRC = "/nhactotnghiep.mp3";
const KHA_AUDIO_SRC = "/nhacvykha.mp3";

// Check if guest name is Vy Kha or Kha (case-insensitive & diacritic-agnostic)
export function isKhaSpecial(name: string): boolean {
  if (!name) return false;
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  return (
    normalized === "kha" ||
    normalized === "vy kha" ||
    normalized === "kha vy" ||
    normalized.includes("vy kha") ||
    /\bkha\b/.test(normalized)
  );
}

// Check if guest is Ba Mẹ or Anh 2 (family members)
export function isFamilySpecial(name: string): boolean {
  if (!name) return false;
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const familyExact = [
    "ba me",
    "bo me",
    "ba va me",
    "ba me yeu quy",
    "ba",
    "me",
    "bo",
    "ma",
    "anh 2",
    "anh hai",
    "anh2",
    "anh hai yeu quy",
    "gia dinh",
    "gia dinh minh"
  ];

  if (familyExact.includes(normalized)) return true;
  if (/\b(ba me|bo me|anh 2|anh hai|anh2|gia dinh)\b/.test(normalized)) return true;
  if (/^(ba|me|bo|ma)$/.test(normalized)) return true;

  return false;
}

// 4-Digit Only PIN input component with auto-enter, success glow & shake
function FourDigitPinInput({
  value,
  onChange,
  onComplete,
  error,
  isSuccess,
  isShake,
  id = "pin-input"
}: {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
  error?: string;
  isSuccess?: boolean;
  isShake?: boolean;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbersOnly = e.target.value.replace(/\D/g, "").slice(0, 4);
    onChange(numbersOnly);
    if (numbersOnly.length === 4 && onComplete) {
      onComplete(numbersOnly);
    }
  };

  return (
    <div
      className={isShake ? "pin-shake" : isSuccess ? "pin-success" : ""}
      style={{ margin: "10px 0 12px", position: "relative" }}
    >
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          cursor: "text"
        }}
      >
        {[0, 1, 2, 3].map((idx) => {
          const digit = value[idx];
          const isCurrent = value.length === idx || (value.length === 4 && idx === 3);
          return (
            <div
              key={idx}
              style={{
                width: "50px",
                height: "56px",
                borderRadius: "14px",
                border: isSuccess
                  ? "2.5px solid #10b981"
                  : error
                    ? "2px solid #ef4444"
                    : isCurrent
                      ? "2.5px solid #ec4899"
                      : digit
                        ? "2px solid #f472b6"
                        : "2px solid #cbd5e1",
                background: isSuccess
                  ? "#ecfdf5"
                  : digit
                    ? "#fff1f2"
                    : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isSuccess ? "1.4rem" : "1.6rem",
                fontWeight: 800,
                color: isSuccess ? "#059669" : "#be185d",
                boxShadow: isSuccess
                  ? "0 0 18px rgba(16, 185, 129, 0.45)"
                  : isCurrent
                    ? "0 0 0 3px rgba(244, 114, 182, 0.25)"
                    : "0 2px 4px rgba(0,0,0,0.03)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: isSuccess ? "scale(1.06)" : isCurrent ? "scale(1.02)" : "scale(1)"
              }}
            >
              {isSuccess ? "✓" : digit ? "●" : ""}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={value}
        onChange={handleTextChange}
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0,
          width: "240px",
          height: "56px",
          cursor: "text"
        }}
        autoFocus
      />
    </div>
  );
}

function InvitationContent() {
  const searchParams = useSearchParams();
  const urlGuest = searchParams.get("guest") || searchParams.get("name") || "";

  // View state: 'intro' = Trang Giới Thiệu; 'invitation' = Trang Thiệp Riêng
  const [currentView, setCurrentView] = useState<"intro" | "invitation">("intro");

  // Guest State
  const [guestName, setGuestName] = useState<string>("");
  const [introInputName, setIntroInputName] = useState<string>("");
  const [introPasscode, setIntroPasscode] = useState<string>("");
  const [passcodeError, setPasscodeError] = useState<string>("");
  const [isIntroPinSuccess, setIsIntroPinSuccess] = useState<boolean>(false);
  const [isIntroPinShake, setIsIntroPinShake] = useState<boolean>(false);

  // Passcode unlock state for Kha
  const [isKhaUnlocked, setIsKhaUnlocked] = useState<boolean>(false);
  const [showPassModal, setShowPassModal] = useState<boolean>(false);
  const [modalPasscode, setModalPasscode] = useState<string>("");
  const [modalPassError, setModalPassError] = useState<string>("");
  const [isModalPinSuccess, setIsModalPinSuccess] = useState<boolean>(false);
  const [isModalPinShake, setIsModalPinShake] = useState<boolean>(false);

  // RSVP Form State
  const [relation, setRelation] = useState<string>("Bạn bè thân thiết");
  const [attendance, setAttendance] = useState<"attending" | "maybe" | "wishes_only">("attending");
  const [wishes, setWishes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareLink, setShareLink] = useState("");

  // Firebase Live Guests
  const [guestList, setGuestList] = useState<GuestEntry[]>([]);
  const [isFirebaseLive, setIsFirebaseLive] = useState(false);

  // Gallery Modal
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Nhạc nền HTML5 chạy ngầm trực tiếp
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevAudioSrcRef = useRef<string>(DEFAULT_AUDIO_SRC);

  // Modal edit name
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [modalInputName, setModalInputName] = useState("");

  // Reaction likes
  const [likes, setLikes] = useState<{ [id: string]: number }>({});

  // Kha VIP mode is active only if name matches AND pass 1611 is unlocked
  const isKhaName = isKhaSpecial(guestName);
  const isKhaVIPActive = isKhaName && isKhaUnlocked;
  const currentPhotos = isKhaVIPActive ? KHA_SPECIAL_PHOTOS : DEFAULT_PHOTOS;
  const activeAudioSrc = isKhaVIPActive ? KHA_AUDIO_SRC : DEFAULT_AUDIO_SRC;

  // Family mode (Ba Mẹ, Anh 2)
  const isFamilyMember = isFamilySpecial(guestName);

  // Initialize guest name & check saved unlock state
  useEffect(() => {
    try {
      const unlocked = localStorage.getItem("kha_unlocked_1611") === "true";
      if (unlocked) setIsKhaUnlocked(true);
    } catch (e) {}

    if (urlGuest) {
      const decoded = decodeURIComponent(urlGuest);
      setGuestName(decoded);
      setIntroInputName(decoded);
      setModalInputName(decoded);
      setCurrentView("invitation");
      try {
        localStorage.setItem("graduation_guest_name", decoded);
      } catch (e) {}
    } else {
      try {
        const stored = localStorage.getItem("graduation_guest_name");
        if (stored) {
          setGuestName(stored);
          setIntroInputName(stored);
          setModalInputName(stored);
        }
      } catch (e) {}
    }
  }, [urlGuest]);

  // Subscribe to Firebase real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToGuests((guests, isLive) => {
      setGuestList(guests);
      setIsFirebaseLive(isLive);
    });
    return () => unsubscribe();
  }, []);

  // Countdown loop to 07/11 13:00
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, GRADUATION_DATE - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set shareable link
  useEffect(() => {
    if (typeof window !== "undefined") {
      const base = window.location.origin + window.location.pathname;
      setShareLink(guestName ? `${base}?guest=${encodeURIComponent(guestName)}` : base);
    }
  }, [guestName]);

  // Tự động bật nhạc nền khi vào trang & tương tác đầu tiên (Thuần âm thanh HTML5)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.75;

    const tryPlayAudio = () => {
      if (!audioRef.current) return;
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(() => {
        // Trình duyệt di động hạn chế autoplay khi chưa có tương tác
      });
    };

    // Thử phát ngay
    tryPlayAudio();

    // Mở khóa âm thanh mượt mà ngay khi người dùng chạm hoặc cuộn lần đầu
    const handleFirstTouch = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setIsPlayingMusic(true);
        }).catch(() => {});
      }
      window.removeEventListener("click", handleFirstTouch);
      window.removeEventListener("touchstart", handleFirstTouch);
      window.removeEventListener("keydown", handleFirstTouch);
      window.removeEventListener("scroll", handleFirstTouch);
    };

    window.addEventListener("click", handleFirstTouch, { passive: true });
    window.addEventListener("touchstart", handleFirstTouch, { passive: true });
    window.addEventListener("keydown", handleFirstTouch, { passive: true });
    window.addEventListener("scroll", handleFirstTouch, { passive: true });

    return () => {
      window.removeEventListener("click", handleFirstTouch);
      window.removeEventListener("touchstart", handleFirstTouch);
      window.removeEventListener("keydown", handleFirstTouch);
      window.removeEventListener("scroll", handleFirstTouch);
    };
  }, []);

  // Tự động đổi bài khi mở khóa chế độ Kha VIP
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (prevAudioSrcRef.current !== activeAudioSrc) {
      prevAudioSrcRef.current = activeAudioSrc;
      const wasPlaying = isPlayingMusic;
      audio.src = activeAudioSrc;
      audio.load();
      if (wasPlaying) {
        audio.play().then(() => {
          setIsPlayingMusic(true);
        }).catch(() => {});
      }
    }
  }, [activeAudioSrc, isPlayingMusic]);

  // Confetti Effects
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#70a9c8", "#8ecae6", "#d4a359", "#bde0fe", "#fef3c7"],
      });
    } catch (e) {}
  };

  const triggerSpecialKhaConfetti = () => {
    try {
      confetti({
        particleCount: 130,
        spread: 90,
        origin: { y: 0.5 },
        colors: ["#ec4899", "#f472b6", "#8ecae6", "#d4a359", "#fb7185"],
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 70,
          origin: { x: 0 },
          colors: ["#f472b6", "#a9d3f1", "#ec4899"],
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 70,
          origin: { x: 1 },
          colors: ["#f472b6", "#a9d3f1", "#ec4899"],
        });
      }, 350);
    } catch (e) {}
  };

  // Music toggle: controls HTML5 Audio
  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingMusic) {
      audio.pause();
      setIsPlayingMusic(false);
    } else {
      audio.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(err => {
        console.warn("Audio play blocked:", err);
      });
    }
  };

  // Handle 4-digit PIN in Intro Screen (Tự động vào luôn khi đúng 1611!)
  const handleIntroPinChange = (val: string) => {
    setIntroPasscode(val);
    setPasscodeError("");

    if (val === KHA_PASSCODE) {
      // Đúng 1611: Hiệu ứng thành công + Tự động vào luôn!
      setIsIntroPinSuccess(true);
      triggerSpecialKhaConfetti();

      // Tự động phát nhạc nếu chưa bật
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setIsPlayingMusic(true);
        }).catch(() => {});
      }

      setTimeout(() => {
        const name = introInputName.trim() || "Vy Kha";
        setIsKhaUnlocked(true);
        setGuestName(name);
        try {
          localStorage.setItem("kha_unlocked_1611", "true");
          localStorage.setItem("graduation_guest_name", name);
        } catch (e) {}
        setCurrentView("invitation");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setIsIntroPinSuccess(false);
      }, 400);
    } else if (val.length === 4) {
      setPasscodeError("Mã bảo mật chưa chính xác, vui lòng thử lại!");
      setIsIntroPinShake(true);
      setTimeout(() => setIsIntroPinShake(false), 500);
    }
  };

  // Submit Intro Form -> Go to Invitation Page (NO Firebase save here)
  const handleOpenInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!introInputName.trim()) return;

    const name = introInputName.trim();
    const isKha = isKhaSpecial(name);

    // If name is Vy Kha, require pass 1611
    if (isKha) {
      if (introPasscode.trim() !== KHA_PASSCODE) {
        setPasscodeError("Mã bảo mật chưa chính xác. Vui lòng kiểm tra lại.");
        setIsIntroPinShake(true);
        setTimeout(() => setIsIntroPinShake(false), 500);
        return;
      }
      setPasscodeError("");
      setIsKhaUnlocked(true);
      try {
        localStorage.setItem("kha_unlocked_1611", "true");
      } catch (e) {}
      triggerSpecialKhaConfetti();
    } else {
      triggerConfetti();
    }

    // Kích hoạt phát nhạc khi bấm xem thiệp (tương tác trực tiếp)
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(() => {});
    }

    setGuestName(name);
    setCurrentView("invitation");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      localStorage.setItem("graduation_guest_name", name);
    } catch (e) {}
  };

  // Handle 4-digit PIN in Modal Screen (Tự động mở khóa khi đúng 1611!)
  const handleModalPinChange = (val: string) => {
    setModalPasscode(val);
    setModalPassError("");

    if (val === KHA_PASSCODE) {
      setIsModalPinSuccess(true);
      triggerSpecialKhaConfetti();
      setTimeout(() => {
        setIsKhaUnlocked(true);
        try {
          localStorage.setItem("kha_unlocked_1611", "true");
        } catch (e) {}
        setShowPassModal(false);
        setIsModalPinSuccess(false);
      }, 400);
    } else if (val.length === 4) {
      setModalPassError("Mã bảo mật chưa chính xác, vui lòng thử lại!");
      setIsModalPinShake(true);
      setTimeout(() => setIsModalPinShake(false), 500);
    }
  };

  // Unlock pass inside the invitation screen modal
  const handleUnlockInModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalPasscode.trim() !== KHA_PASSCODE) {
      setModalPassError("Mã bảo mật không chính xác. Vui lòng thử lại.");
      setIsModalPinShake(true);
      setTimeout(() => setIsModalPinShake(false), 500);
      return;
    }
    setModalPassError("");
    setIsKhaUnlocked(true);
    setShowPassModal(false);
    try {
      localStorage.setItem("kha_unlocked_1611", "true");
    } catch (e) {}
    triggerSpecialKhaConfetti();
  };

  // Handle Form Submit to Firebase (ONLY in RSVP section)
  const handleSubmitRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      alert("Vui lòng nhập họ và tên của bạn trước khi gửi.");
      return;
    }

    setIsSubmitting(true);
    const color = isKhaVIPActive ? "#ec4899" : getRandomColor();

    try {
      await addGuestInvitation({
        name: guestName.trim(),
        relation,
        attendance,
        wishes: wishes.trim() || (isKhaVIPActive 
          ? "Chúc mừng ngày tốt nghiệp của chúng mình! Cảm ơn vì thanh xuân luôn có nhau! 🎓💖"
          : "Chúc mừng Bích Trâm tốt nghiệp rực rỡ, tương lai rộng mở và luôn thành công!"),
        avatarColor: color,
      });

      try {
        localStorage.setItem("graduation_guest_name", guestName.trim());
      } catch (e) {}

      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      if (isKhaVIPActive) {
        triggerSpecialKhaConfetti();
      } else {
        triggerConfetti();
      }

      setWishes("");
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Submission error:", error);
      setIsSubmitting(false);
      alert("Đã ghi nhận lời chúc của bạn!");
    }
  };

  const handleUpdateNameModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalInputName.trim()) return;
    const name = modalInputName.trim();
    setGuestName(name);
    setIntroInputName(name);
    setShowQuickModal(false);
    try {
      localStorage.setItem("graduation_guest_name", name);
    } catch (e) {}

    if (isKhaSpecial(name)) {
      if (!isKhaUnlocked) {
        setShowPassModal(true);
      } else {
        triggerSpecialKhaConfetti();
      }
    } else {
      triggerConfetti();
    }
  };

  const getRandomColor = () => {
    const colors = ["#4a8bbd", "#3b88c4", "#57a5dc", "#2563eb", "#0284c7", "#0d9488", "#d97706"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const copyToClipboard = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareLink).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      });
    }
  };

  const handleLike = (id?: string) => {
    if (!id) return;
    setLikes(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
    triggerConfetti();
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Background soft pastel ambient bubbles */}
      <div className="bg-decor-circle bg-circle-1" />
      <div className="bg-decor-circle bg-circle-2" />
      <div className="bg-decor-circle bg-circle-3" />

      {/* HTML5 Audio Background Player */}
      <audio
        ref={audioRef}
        id="bg-music-player"
        src={activeAudioSrc}
        preload="auto"
        loop
        playsInline
        style={{ display: "none" }}
      />

      {/* Floating Audio Controller with Real Equalizer Animation */}
      <div
        className="audio-floating-btn"
        onClick={toggleMusic}
        title={isPlayingMusic ? "Tạm dừng nhạc nền" : "Bật nhạc nền"}
        role="button"
        tabIndex={0}
      >
        <div className={`audio-pulse-icon ${isPlayingMusic ? "playing" : ""}`}>
          {isPlayingMusic ? (
            <div className="equalizer-bars">
              <span className="equalizer-bar" style={{ background: "#ffffff" }} />
              <span className="equalizer-bar" style={{ background: "#ffffff" }} />
              <span className="equalizer-bar" style={{ background: "#ffffff" }} />
              <span className="equalizer-bar" style={{ background: "#ffffff" }} />
            </div>
          ) : (
            <VolumeX size={18} />
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: isKhaVIPActive ? "#be185d" : "var(--navy-deep)", lineHeight: 1.2 }}>
            {isPlayingMusic
              ? (isKhaVIPActive ? "Nhạc dành riêng cho Kha 💖" : "Đang phát nhạc tốt nghiệp")
              : (isKhaVIPActive ? "Bật nhạc của Kha & Trâm" : "Bật nhạc tốt nghiệp")}
          </span>
          <span className="audio-subtext" style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.1 }}>
            {isPlayingMusic ? "Âm thanh nền lễ trao bằng 🎓" : "Chạm để nghe nhạc nền 🎵"}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MÀN 1: TRANG GIỚI THIỆU & NHẬP TÊN (KHÔNG LƯU DỮ LIỆU)   */}
      {/* ======================================================== */}
      {currentView === "intro" && (
        <main className="intro-screen">
          <div className="intro-modal-card">
            {/* Logo Trường Đại học FPT */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
              <img
                src="/fpt-logo.svg"
                alt="Logo Trường Đại học FPT"
                style={{ height: "46px", maxWidth: "190px", objectFit: "contain" }}
              />
            </div>

            {/* School Tag */}
            <div className="badge-tag" style={{ marginBottom: "16px" }}>
              <GraduationCap size={16} />
              <span>TRƯỜNG ĐẠI HỌC FPT • LỄ TỐT NGHIỆP</span>
            </div>

            {/* Graduate Avatar with Glowing Ring */}
            <div className="intro-avatar-ring">
              <img src="/anh3.jpg" alt="Tân cử nhân Cung Nguyễn Bích Trâm" />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", fontWeight: 700 }}>
                Tân Cử Nhân
              </span>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--navy-deep)", margin: "4px 0" }}>
                Cung Nguyễn Bích Trâm
              </h1>
              <div style={{ display: "inline-flex", gap: "10px", alignItems: "center", fontSize: "0.9rem", color: "var(--navy-light)" }}>
                <span>MSSV: <strong>SE184306</strong></span>
                <span>•</span>
                <span style={{ color: "var(--fpt-orange)", fontWeight: 700 }}>Phiên: 07/11 – Ca 3</span>
              </div>
            </div>

            <p style={{
              fontSize: "0.95rem",
              color: "var(--text-muted)",
              lineHeight: "1.6",
              maxWidth: "460px",
              margin: "0 auto 24px"
            }}>
              Chào mừng bạn đến với Lễ tốt nghiệp cử nhân của Bích Trâm! Nhập họ và tên để mở tấm thiệp mời riêng dành cho bạn.
            </p>

            {/* Form Nhập Tên Để Vào Thiệp (Không lưu Firebase ở trang này) */}
            <form onSubmit={handleOpenInvitation} style={{ maxWidth: "440px", margin: "0 auto" }}>
              <div style={{ marginBottom: "14px", textAlign: "left" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--navy-medium)", marginBottom: "6px" }}>
                  Họ và tên của bạn:
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Nhập tên của bạn..."
                  value={introInputName}
                  onChange={(e) => {
                    setIntroInputName(e.target.value);
                    setPasscodeError("");
                  }}
                  className="form-input"
                  style={{ fontSize: "1rem", padding: "14px 18px" }}
                  required
                />
              </div>

              {/* Secret Passcode Box when 'Vy Kha' or 'Kha' is entered */}
              {isKhaSpecial(introInputName) && (
                <div className="passcode-box">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#be185d", fontWeight: 700, fontSize: "0.85rem", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <KeyRound size={16} />
                      <span>Mã bảo mật (4 số):</span>
                    </div>
                  </div>

                  <FourDigitPinInput
                    id="intro-pin"
                    value={introPasscode}
                    onChange={handleIntroPinChange}
                    isSuccess={isIntroPinSuccess}
                    isShake={isIntroPinShake}
                    error={passcodeError}
                  />

                  {isIntroPinSuccess && (
                    <div style={{ color: "#059669", fontSize: "0.86rem", fontWeight: 700, textAlign: "center", marginTop: "4px" }}>
                      ✓ Mã chính xác! Đang tự động mở thiệp... ✨
                    </div>
                  )}

                  {passcodeError && (
                    <div style={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 600, textAlign: "center", marginTop: "4px" }}>
                      {passcodeError}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", padding: "15px 24px", fontSize: "1.05rem" }}
              >
                <span>Mở Thiệp Mời Của Bạn</span>
                <ArrowRight size={18} />
              </button>
            </form>

            {/* Official Time Snapshot */}
            <div style={{
              marginTop: "24px",
              paddingTop: "18px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              flexWrap: "wrap"
            }}>
              <div>📅 Ngày: <strong>07/11/2026</strong></div>
              <div>⏰ Check-in: <strong>13h00 - 13h50</strong></div>
              <div>🎓 Trao bằng: <strong>14h00 - 16h30</strong></div>
            </div>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* MÀN 2: TRANG THIỆP MỜI RIÊNG BIỆT (PERSONALIZED INVITATION)*/}
      {/* ======================================================== */}
      {currentView === "invitation" && (
        <div className="container" style={{ paddingBottom: "100px" }}>
          {/* Top Navigation & Status Bar */}
          <header style={{ paddingTop: "24px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
              <button
                onClick={() => {
                  setCurrentView("intro");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem", gap: "6px" }}
              >
                <ArrowLeft size={16} />
                <span>Trang Giới Thiệu</span>
              </button>

              <button
                onClick={() => {
                  setModalInputName(guestName);
                  setShowQuickModal(true);
                }}
                style={{
                  background: isKhaVIPActive ? "#fce7f3" : "var(--pastel-blue-100)",
                  border: `1px solid ${isKhaVIPActive ? "#f472b6" : "var(--pastel-blue-300)"}`,
                  borderRadius: "20px",
                  padding: "6px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: isKhaVIPActive ? "#be185d" : "var(--pastel-blue-700)",
                  cursor: "pointer"
                }}
              >
                Đổi tên khách mời ({guestName || "Chưa đặt"}) ✍️
              </button>
            </div>

            {/* Special VIP banner when Kha has unlocked with pass 1611 */}
            {isKhaVIPActive && (
              <div className="kha-special-badge">
                <Sparkles size={18} color="#ec4899" />
                <span>✨ CHẾ ĐỘ ĐẶC BIỆT DÀNH RIÊNG CHO VY KHA ✨</span>
                <Heart size={18} fill="#ec4899" color="#ec4899" />
              </div>
            )}

            {/* If Kha entered name but has not entered pass 1611 yet */}
            {isKhaName && !isKhaUnlocked && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#fef2f2",
                border: "1.5px dashed #f87171",
                padding: "8px 20px",
                borderRadius: "30px",
                marginBottom: "16px"
              }}>
                <Lock size={16} color="#dc2626" />
                <span style={{ fontSize: "0.85rem", color: "#991b1b", fontWeight: 600 }}>
                  Chào Vy Kha! Vui lòng nhập mã bảo mật để mở khóa album ảnh kỷ niệm:
                </span>
                <button
                  onClick={() => setShowPassModal(true)}
                  style={{
                    background: "#ec4899",
                    color: "#fff",
                    border: "none",
                    borderRadius: "20px",
                    padding: "4px 14px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Nhập mã bảo mật 🔑
                </button>
              </div>
            )}

            {/* Guest Welcome Bar */}
            <div className="guest-welcome-bar">
              <Sparkles size={16} color="var(--gold-accent)" />
              <span style={{ fontSize: "0.95rem", color: "var(--navy-light)" }}>
                Trân trọng kính gửi: <strong style={{ color: isKhaVIPActive ? "#be185d" : "var(--pastel-blue-700)", fontSize: "1.05rem" }}>{guestName || "Khách Quý"}</strong> {isKhaVIPActive && "💖"}
              </span>
            </div>
          </header>

          {/* Hero Section */}
          <section className="hero-section" style={{ paddingBottom: "20px" }}>
            <div className="badge-tag">
              <GraduationCap size={18} />
              <span>ĐẠI HỌC FPT • LỄ TỐT NGHIỆP</span>
            </div>

            <h1 className="hero-title font-serif">
              Lễ Trao Bằng <span>Tốt Nghiệp</span>
            </h1>

            <p className="hero-subtitle">
              &ldquo;Khép lại những năm tháng thanh xuân nỗ lực dưới mái trường, mở ra hành trình mới tràn ngập ước mơ và khát vọng vươn xa.&rdquo;
            </p>

            {/* Graduate Portrait Showcase */}
            <div className="portrait-wrapper">
              <div className="portrait-glow-ring" />
              <div className="portrait-img-box">
                <img src={isKhaVIPActive ? "/kha.jpg" : "/anh3.jpg"} alt="Tân cử nhân Cung Nguyễn Bích Trâm" />
              </div>
              <div className="portrait-badge-cap" title="Tân Cử Nhân">
                <GraduationCap size={28} />
              </div>
            </div>

            <div style={{ marginTop: "-10px", marginBottom: "26px" }}>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--navy-deep)" }}>
                Cung Nguyễn Bích Trâm
              </h2>
              <p style={{ color: "var(--fpt-orange)", fontWeight: 700, fontSize: "0.95rem", marginTop: "2px" }}>
                MSSV: SE184306 • Phiên trao bằng: 07/11 – Ca 3
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                FPT University • Ready For Global Career
              </p>
            </div>

            {/* Countdown Clock (Calibrated to 07/11 13:00) */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--text-muted)", marginBottom: "12px", fontWeight: 700 }}>
                Đếm ngược đến Lễ tốt nghiệp (07/11 • 13h00) 🎓
              </div>
              <div className="countdown-container">
                <div className="countdown-box">
                  <div className="countdown-number">{timeLeft.days}</div>
                  <div className="countdown-label">Ngày</div>
                </div>
                <div className="countdown-box">
                  <div className="countdown-number">{timeLeft.hours}</div>
                  <div className="countdown-label">Giờ</div>
                </div>
                <div className="countdown-box">
                  <div className="countdown-number">{timeLeft.minutes}</div>
                  <div className="countdown-label">Phút</div>
                </div>
                <div className="countdown-box">
                  <div className="countdown-number">{timeLeft.seconds}</div>
                  <div className="countdown-label">Giây</div>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* THÔNG TIN THAM DỰ LỄ TỐT NGHIỆP THEO TRƯỜNG (CHÍNH XÁC)  */}
          {/* ======================================================== */}
          <section className="fpt-official-card">
            <div className="fpt-official-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src="/fpt-logo.svg"
                  alt="Trường Đại học FPT"
                  style={{ height: "38px", objectFit: "contain" }}
                />
              </div>
              <div className="fpt-header-sub">THÔNG TIN THAM DỰ LỄ TỐT NGHIỆP</div>
            </div>

            <div className="fpt-candidate-box">
              <div style={{ fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                Tân cử nhân
              </div>
              <div className="fpt-candidate-name font-serif">
                Cung Nguyễn Bích Trâm
              </div>
              <div className="fpt-candidate-mssv">
                SE184306
              </div>
              <div className="fpt-session-pill">
                <span>PHIÊN TRAO BẰNG:</span>
                <strong>07/11 – Ca 3</strong>
              </div>
            </div>

            {/* Official Time Schedule Blocks */}
            <div className="fpt-time-grid">
              <div className="fpt-time-col">
                <div className="fpt-time-label">Giờ tập trung check-in</div>
                <div className="fpt-time-value">13h00 – 13h50</div>
                <div className="fpt-time-sub">Phòng check-in: <strong>Đang cập nhật</strong></div>
              </div>

              <div className="fpt-time-col">
                <div className="fpt-time-label">Thời gian trao bằng</div>
                <div className="fpt-time-value">14h00 – 16h30</div>
                <div className="fpt-time-sub">Địa điểm: <strong>Hội trường lớn FPT</strong></div>
              </div>

              {/* Vị trí & Chỗ ngồi: Chỉ hiển thị khi nhập tên Ba Mẹ hoặc Anh 2 */}
              {isFamilyMember && (
                <div className="fpt-time-col">
                  <div className="fpt-time-label">Vị trí & Chỗ ngồi</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
                    Ghế tân cử nhân & Phụ huynh
                  </div>
                  <div className="fpt-time-sub">Khu vực: <strong>Đang cập nhật</strong></div>
                </div>
              )}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              paddingTop: "14px",
              borderTop: "1px solid #f1f5f9"
            }}>
              <p style={{ fontSize: "0.85rem", color: "#64748b", fontStyle: "italic" }}>
                Mong bạn hãy dành chút thời gian kiểm tra thông tin và đến đúng giờ cùng Bích Trâm nhé!
              </p>

              <div style={{ display: "flex", gap: "10px" }}>
                <a
                  href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=L%E1%BB%85+T%E1%BB%91t+Nghi%E1%BB%87p+-+Cung+Nguy%E1%BB%85n+B%C3%ADch+Tr%C3%A2m+(Ca+3)&dates=20261107T060000Z/20261107T093000Z&details=L%E1%BB%85+trao+b%E1%BA%B1ng+t%E1%BB%91t+nghi%E1%BB%87p+Cung+Nguy%E1%BB%85n+B%C3%ADch+Tr%C3%A2m+(SE184306)+Phi%C3%AAn+07/11+Ca+3.+Check-in:+13h00-13h50,+Trao+b%E1%BA%B1ng:+14h00-16h30&location=Tr%C6%B0%E1%BB%9Dng+%C4%90%E1%BA%A1i+h%E1%BB%8Dc+FPT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                >
                  <Calendar size={16} />
                  Thêm vào Lịch Google
                </a>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=FPT+University"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                >
                  <MapPin size={16} />
                  Bản đồ trường
                </a>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* SPECIAL SECTION FOR VY KHA (UNLOCKED WITH PASS 1611)     */}
          {/* ======================================================== */}
          {isKhaVIPActive && (
            <section className="kha-highlight-card">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#ec4899", fontWeight: 700, fontSize: "1.1rem", marginBottom: "8px" }}>
                <Heart size={22} fill="#ec4899" />
                <span>Góc Kỷ Niệm Của Chúng Mình: Thanh Xuân Có Kha 💖</span>
                <Heart size={22} fill="#ec4899" />
              </div>

              <h3 className="font-serif" style={{ fontSize: "1.8rem", color: "#831843", marginBottom: "10px" }}>
                Cảm Ơn Vì Đã Luôn Ở Bên
              </h3>

              <p style={{ maxWidth: "600px", margin: "0 auto 20px", color: "#475569", lineHeight: "1.6", fontSize: "1rem" }}>
                &ldquo;Ngày tốt nghiệp của Bích Trâm sẽ không thể trọn vẹn nếu thiếu đi nụ cười và sự đồng hành của Kha. Cảm ơn vì đã cùng nhau đi qua bao mùa thi, bao dự án và tạo nên những kỷ niệm đẹp nhất của tuổi trẻ!&rdquo;
              </p>

              {/* Continuous Auto-Scrolling Marquee of Kha photos ("chỗ này cuộn liên tục") */}
              <div className="kha-marquee-container" title="Cuộn liên tục • Rê chuột để tạm dừng & bấm xem ảnh">
                <div className="kha-marquee-track">
                  {[
                    ...["/kha.jpg", "/kha1.jpg", "/kha2.jpg", "/kha4.jpg", "/kha5.jpg", "/kha6.jpg", "/kha7.jpg", "/kha8.jpg"],
                    ...["/kha.jpg", "/kha1.jpg", "/kha2.jpg", "/kha4.jpg", "/kha5.jpg", "/kha6.jpg", "/kha7.jpg", "/kha8.jpg"]
                  ].map((imgSrc, i) => {
                    const originalIdx = i % 8;
                    return (
                      <div
                        key={i}
                        className="kha-photo-card"
                        onClick={() => setSelectedImageIndex(originalIdx)}
                      >
                        <img src={imgSrc} alt={`Khoảnh khắc cùng Kha ${originalIdx + 1}`} />
                        <div style={{ padding: "8px", fontSize: "0.8rem", fontWeight: 600, color: "#831843", textAlign: "center" }}>
                          Khoảnh khắc #{originalIdx + 1} 💖
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* PERSONALIZED INVITATION LETTER CARD                      */}
          {/* ======================================================== */}
          <section className="invitation-card-section" id="invitation-letter">
            <div className="invitation-card">
              <div className="card-inner-border">
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: isKhaVIPActive 
                      ? "linear-gradient(135deg, #fce7f3, #fbcfe8)"
                      : "linear-gradient(135deg, var(--pastel-blue-200), var(--pastel-blue-300))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isKhaVIPActive ? "#ec4899" : "var(--pastel-blue-700)"
                  }}>
                    {isKhaVIPActive ? <Heart size={26} fill="#ec4899" /> : <Award size={26} />}
                  </div>
                </div>

                <span style={{
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  fontSize: "0.95rem",
                  color: "var(--text-muted)",
                  fontWeight: 600
                }}>
                  Thư Mời Tham Dự
                </span>

                <h2 className="font-serif" style={{ fontSize: "2.2rem", color: "var(--navy-deep)", margin: "8px 0" }}>
                  Lễ Tốt Nghiệp Cử Nhân
                </h2>

                <p style={{ color: "var(--navy-light)", fontSize: "1rem", marginTop: "10px" }}>
                  Trân trọng kính mời
                </p>

                <div className="guest-name-highlight font-serif" style={{
                  color: isKhaVIPActive ? "#be185d" : "var(--pastel-blue-700)",
                  borderBottomColor: isKhaVIPActive ? "#f472b6" : "var(--gold-accent)"
                }}>
                  {guestName ? guestName : "Khách Quý & Bạn Bè"} {isKhaVIPActive && "💖"}
                </div>

                <p style={{
                  maxWidth: "560px",
                  margin: "12px auto 28px",
                  lineHeight: "1.7",
                  color: "var(--navy-medium)",
                  fontSize: "1.05rem"
                }}>
                  {isKhaVIPActive ? (
                    <>
                      Sự hiện diện của <strong>{guestName}</strong> là món quà ý nghĩa và ấm áp nhất trong ngày lễ tốt nghiệp này của Bích Trâm. Hãy cùng nhau ghi lại thật nhiều khoảnh khắc đáng nhớ nhé!
                    </>
                  ) : isFamilyMember ? (
                    <>
                      Sự hiện diện của <strong>{guestName}</strong> là điểm tựa vững chắc, niềm tự hào và hạnh phúc lớn nhất của con/em trong ngày lễ tốt nghiệp thiêng liêng này. Cảm ơn vì đã luôn yêu thương và dõi theo con/em suốt chặng đường qua!
                    </>
                  ) : (
                    <>
                      Sự hiện diện của <strong>{guestName || "bạn"}</strong> cùng những lời chúc tốt đẹp là niềm vinh dự, hạnh phúc to lớn cho Bích Trâm và gia đình trong cột mốc tốt nghiệp thiêng liêng này.
                      Rất mong được đón tiếp bạn để cùng chụp những bức hình kỷ niệm thật đẹp!
                    </>
                  )}
                </p>

                {/* Event Quick Snapshot */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  background: "rgba(229, 242, 250, 0.5)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px",
                  border: "1px solid var(--pastel-blue-200)",
                  marginBottom: "28px",
                  textAlign: "left"
                }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Calendar size={22} color="var(--pastel-blue-600)" />
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                        Thời gian
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--navy-deep)", fontSize: "0.95rem" }}>
                        Thứ Bảy, 07/11/2026 (Ca 3)
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--fpt-orange)", fontWeight: 600 }}>
                        Check-in: 13h00 • Trao bằng: 14h00
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <MapPin size={22} color="var(--pastel-blue-600)" />
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                        Địa điểm
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--navy-deep)", fontSize: "0.95rem" }}>
                        Trường Đại học FPT
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Hội trường lớn (Grand Hall)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                  <a href="#rsvp" className="btn-primary" onClick={isKhaVIPActive ? triggerSpecialKhaConfetti : triggerConfetti}>
                    <CheckCircle2 size={18} />
                    Xác nhận tham dự & Gửi lời chúc
                  </a>
                  <button onClick={copyToClipboard} className="btn-secondary">
                    {copySuccess ? <Check size={18} color="#16a34a" /> : <Share2 size={18} />}
                    {copySuccess ? "Đã sao chép link!" : "Chia sẻ thiệp mời"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* PHOTO ALBUM GALLERY (CONDITIONAL: ANH 1-3 OR KHA 1-8)    */}
          {/* ======================================================== */}
          <section style={{ margin: "60px 0" }}>
            <div className="section-header">
              <div className="badge-tag">
                {isKhaVIPActive ? <Unlock size={16} color="#ec4899" /> : <Sparkles size={16} />}
                <span>{isKhaVIPActive ? "Bộ Ảnh Kỷ Niệm Đặc Biệt Cùng Vy Kha" : "Khoảnh Khắc Tốt Nghiệp"}</span>
              </div>

              <h2 className="section-title font-serif">
                {isKhaVIPActive ? (
                  <span>Album Kỷ Niệm 💖 <em style={{ color: "#ec4899" }}>Kha & Bích Trâm</em></span>
                ) : (
                  "Khoảnh Khắc Tốt Nghiệp"
                )}
              </h2>

              <p className="section-desc">
                {isKhaVIPActive ? (
                  "Bộ ảnh kỷ niệm đặc biệt ghi lại chặng đường thanh xuân sát cánh bên nhau của Kha và Bích Trâm!"
                ) : (
                  "Hình ảnh ghi lại dấu ấn của những năm tháng rực rỡ dưới mái trường FPT của Bích Trâm"
                )}
              </p>
            </div>

            <div className="gallery-grid">
              {currentPhotos.map((photo, index) => (
                <div
                  key={index}
                  className="gallery-item"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img src={photo.src} alt={photo.title} loading="lazy" />
                  <div className="gallery-overlay">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{photo.title}</div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>{photo.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ======================================================== */}
          {/* RSVP FORM & SỔ LƯU BÚT FIREBASE (LƯU LÊN FIREBASE)       */}
          {/* ======================================================== */}
          <section id="rsvp" className="rsvp-section">
            <div className="section-header" style={{ marginBottom: "28px" }}>
              <div className="badge-tag">
                <Heart size={16} />
                <span>Xác Nhận Tham Dự & Sổ Lưu Bút</span>
              </div>
              <h2 className="section-title font-serif">Gửi Lời Chúc Đến Cung Nguyễn Bích Trâm</h2>
              <p className="section-desc">
                Lời chúc của bạn sẽ xuất hiện trang trọng trong sổ lưu bút tốt nghiệp!
              </p>
            </div>

            <form onSubmit={handleSubmitRSVP} style={{ maxWidth: "620px", margin: "0 auto" }}>
              {/* Guest Name Input */}
              <div className="form-group">
                <label className="form-label">
                  Họ và tên của bạn <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên của bạn..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>

              {/* Relationship */}
              <div className="form-group">
                <label className="form-label">Mối quan hệ với tân cử nhân</label>
                <select
                  className="form-select"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                >
                  {RELATIONS.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              {/* Attendance Radio Pills */}
              <div className="form-group">
                <label className="form-label">Bạn sẽ đến chung vui chứ?</label>
                <div className="radio-pills">
                  <div
                    className={`radio-pill ${attendance === "attending" ? "active" : ""}`}
                    onClick={() => setAttendance("attending")}
                  >
                    🎉 Chắc chắn sẽ đến tham gia
                  </div>
                  <div
                    className={`radio-pill ${attendance === "maybe" ? "active" : ""}`}
                    onClick={() => setAttendance("maybe")}
                  >
                    ✨ Đang sắp xếp (Sẽ cố gắng)
                  </div>
                  <div
                    className={`radio-pill ${attendance === "wishes_only" ? "active" : ""}`}
                    onClick={() => setAttendance("wishes_only")}
                  >
                    💌 Tiếc quá, gửi ngàn lời chúc từ xa!
                  </div>
                </div>
              </div>

              {/* Wishes Textarea */}
              <div className="form-group">
                <label className="form-label">
                  Lời chúc tốt nghiệp gửi đến Bích Trâm
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Nhập những lời chúc chân thành, ấm áp của bạn tại đây..."
                  value={wishes}
                  onChange={(e) => setWishes(e.target.value)}
                />

                {/* Quick wish suggestion chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                  {[
                    "🎓 Chúc mừng tân cử nhân xuất sắc!",
                    "🌟 Tương lai rực rỡ, luôn thành công nhé!",
                    "💖 Tự hào về Bích Trâm rất nhiều!",
                    "🌸 Luôn xinh đẹp, hạnh phúc và toả sáng!"
                  ].map((quickWish, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setWishes(quickWish)}
                      style={{
                        background: "var(--pastel-blue-50)",
                        border: "1px solid var(--pastel-blue-200)",
                        borderRadius: "20px",
                        padding: "5px 12px",
                        fontSize: "0.78rem",
                        color: "var(--navy-light)",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {quickWish}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <div style={{ textAlign: "center", marginTop: "28px" }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    padding: "16px 32px",
                    fontSize: "1.05rem",
                    background: isKhaVIPActive ? "linear-gradient(135deg, #ec4899, #be185d)" : undefined
                  }}
                >
                  {isSubmitting ? (
                    <span>Đang gửi lời chúc...</span>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Gửi lời chúc tốt nghiệp ✨</span>
                    </>
                  )}
                </button>
              </div>

              {/* Success Banner */}
              {submitSuccess && (
                <div style={{
                  marginTop: "20px",
                  background: "#ecfdf5",
                  border: "1px solid #6ee7b7",
                  borderRadius: "var(--radius-md)",
                  padding: "16px 20px",
                  textAlign: "center",
                  color: "#065f46",
                  fontWeight: 600,
                  animation: "fadeInDown 0.4s ease"
                }}>
                  🎉 Cảm ơn bạn! Lời chúc của bạn đã được gửi thành công và lưu vào sổ lưu bút!
                </div>
              )}
            </form>

            {/* Firebase Status & Live Guestbook Wall */}
            <div style={{ marginTop: "48px", borderTop: "1px solid var(--pastel-blue-200)", paddingTop: "36px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageSquare size={20} color="var(--pastel-blue-600)" />
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--navy-deep)" }}>
                    Sổ Lưu Bút Lễ Tốt Nghiệp ({guestList.length})
                  </h3>
                </div>

              </div>

              {/* List of guest wishes */}
              {guestList.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "36px 20px",
                  color: "var(--text-muted)",
                  background: "var(--pastel-blue-50)",
                  borderRadius: "var(--radius-md)"
                }}>
                  Chưa có lời chúc nào. Hãy là người đầu tiên nhập tên và gửi lời chúc tốt nghiệp nhé! 🎓
                </div>
              ) : (
                <div className="wishes-wall-grid">
                  {guestList.map((guest, idx) => {
                    const guestIsKha = isKhaSpecial(guest.name);
                    return (
                      <div
                        key={guest.id || idx}
                        className="wish-card"
                        style={guestIsKha ? { border: "1.5px solid #f472b6", background: "rgba(255, 245, 247, 0.95)" } : {}}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                          <div
                            className="wish-avatar"
                            style={{ background: guestIsKha ? "#ec4899" : (guest.avatarColor || "#4a8bbd") }}
                          >
                            {guest.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: guestIsKha ? "#831843" : "var(--navy-deep)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {guest.name} {guestIsKha && "💖"}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {guest.relation || "Bạn bè"} • {
                                guest.attendance === "attending" ? "🎉 Sẽ tham gia" :
                                guest.attendance === "maybe" ? "✨ Đang sắp xếp" : "💌 Gửi lời chúc"
                              }
                            </div>
                          </div>
                        </div>

                        <p style={{
                          fontSize: "0.9rem",
                          color: "var(--navy-medium)",
                          lineHeight: "1.5",
                          fontStyle: "italic",
                          background: guestIsKha ? "rgba(254, 226, 226, 0.5)" : "rgba(244, 249, 253, 0.7)",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-sm)",
                          borderLeft: `3px solid ${guestIsKha ? "#ec4899" : "var(--pastel-blue-400)"}`
                        }}>
                          &ldquo;{guest.wishes || "Chúc mừng bạn tốt nghiệp rực rỡ!"}&rdquo;
                        </p>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {new Date(guest.createdAt).toLocaleDateString("vi-VN", {
                              day: "numeric",
                              month: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>

                          <button
                            onClick={() => handleLike(guest.id || String(idx))}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "none",
                              border: "none",
                              color: "#ec4899",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              padding: "4px 8px",
                              borderRadius: "12px"
                            }}
                          >
                            <Heart size={14} fill="#ec4899" />
                            <span>{(likes[guest.id || String(idx)] || 0) + 1}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ======================================================== */}
          {/* SHARE PERSONALIZED LINK BANNER                           */}
          {/* ======================================================== */}
          <section style={{
            background: "linear-gradient(135deg, rgba(229, 242, 250, 0.9), rgba(255, 255, 255, 0.95))",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--pastel-blue-300)",
            padding: "24px 28px",
            margin: "40px 0",
            boxShadow: "var(--glass-shadow)",
            textAlign: "center"
          }}>
            <h3 className="font-serif" style={{ fontSize: "1.4rem", color: "var(--navy-deep)", marginBottom: "8px" }}>
              Chia Sẻ Thiệp Mời Đến Bạn Bè
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px" }}>
              Sao chép link thiệp đã được cá nhân hóa để gửi qua Zalo, Messenger hoặc Story
            </p>

            <div style={{
              display: "flex",
              gap: "8px",
              maxWidth: "600px",
              margin: "0 auto",
              background: "#ffffff",
              padding: "6px 8px 6px 16px",
              borderRadius: "50px",
              border: "1.5px solid var(--pastel-blue-300)",
              alignItems: "center"
            }}>
              <input
                type="text"
                readOnly
                value={shareLink}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: "0.9rem",
                  color: "var(--navy-light)",
                  background: "transparent"
                }}
              />
              <button onClick={copyToClipboard} className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                {copySuccess ? "Đã chép" : "Sao chép"}
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer style={{ textAlign: "center", padding: "40px 0 20px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <p style={{ fontWeight: 700, color: "var(--navy-medium)" }}>
              LỄ TỐT NGHIỆP • TRƯỜNG ĐẠI HỌC FPT
            </p>
            <p style={{ marginTop: "4px" }}>
              Tân cử nhân: <strong>Cung Nguyễn Bích Trâm</strong> (SE184306) • Phiên: 07/11 – Ca 3
            </p>

          </footer>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASSCODE MODAL FOR VY KHA (IF UNLOCKED IN INVITATION VIEW) */}
      {/* ======================================================== */}
      {showPassModal && (
        <div className="modal-backdrop" onClick={() => setShowPassModal(false)}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "var(--radius-lg)",
              padding: "32px 28px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
              position: "relative",
              textAlign: "center"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPassModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: "pointer"
              }}
            >
              <X size={20} color="var(--text-muted)" />
            </button>

            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#fdf2f8",
              border: "2px solid #f472b6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#ec4899"
            }}>
              <KeyRound size={28} />
            </div>

            <h3 className="font-serif" style={{ fontSize: "1.4rem", color: "#831843", marginBottom: "8px" }}>
              Nhập Mã Bảo Mật
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "18px", lineHeight: "1.5" }}>
              Chào mừng Vy Kha! Vui lòng nhập mã bảo mật (4 số) để mở khóa album ảnh kỷ niệm:
            </p>

            <form onSubmit={handleUnlockInModal}>
              <FourDigitPinInput
                id="modal-pin"
                value={modalPasscode}
                onChange={handleModalPinChange}
                isSuccess={isModalPinSuccess}
                isShake={isModalPinShake}
                error={modalPassError}
              />

              {isModalPinSuccess && (
                <div style={{ color: "#059669", fontSize: "0.86rem", fontWeight: 700, marginBottom: "14px", textAlign: "center" }}>
                  ✓ Mã chính xác! Đang mở khóa album... ✨
                </div>
              )}

              {modalPassError && (
                <div style={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 600, marginBottom: "14px", textAlign: "center" }}>
                  {modalPassError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #ec4899, #be185d)"
                }}
              >
                <Unlock size={18} />
                <span>Mở Khóa Album ✨</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* LIGHTBOX MODAL FOR GALLERY ZOOM                         */}
      {/* ======================================================== */}
      {selectedImageIndex !== null && (
        <div className="modal-backdrop" onClick={() => setSelectedImageIndex(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedImageIndex(null)}>
              <X size={24} />
            </button>
            <img
              src={currentPhotos[selectedImageIndex]?.src || DEFAULT_PHOTOS[0].src}
              alt={currentPhotos[selectedImageIndex]?.title || "Ảnh kỷ niệm"}
            />

            <button
              onClick={() => setSelectedImageIndex((prev) => (prev! > 0 ? prev! - 1 : currentPhotos.length - 1))}
              style={{
                position: "absolute",
                left: "-20px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255, 255, 255, 0.8)",
                border: "none",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
              }}
            >
              <ChevronLeft size={24} color="var(--navy-deep)" />
            </button>

            <button
              onClick={() => setSelectedImageIndex((prev) => (prev! < currentPhotos.length - 1 ? prev! + 1 : 0))}
              style={{
                position: "absolute",
                right: "-20px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255, 255, 255, 0.8)",
                border: "none",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
              }}
            >
              <ChevronRight size={24} color="var(--navy-deep)" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* QUICK NAME CHANGE MODAL (FROM INVITATION VIEW)           */}
      {/* ======================================================== */}
      {showQuickModal && (
        <div className="modal-backdrop" onClick={() => setShowQuickModal(false)}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "var(--radius-lg)",
              padding: "28px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQuickModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: "pointer"
              }}
            >
              <X size={20} color="var(--text-muted)" />
            </button>

            <h3 className="font-serif" style={{ fontSize: "1.3rem", color: "var(--navy-deep)", marginBottom: "6px" }}>
              Đổi Tên Khách Mời
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Nhập tên mới để cá nhân hóa lại toàn bộ thiệp mời.
            </p>

            <form onSubmit={handleUpdateNameModal}>
              <input
                type="text"
                autoFocus
                placeholder="Nhập tên mới..."
                value={modalInputName}
                onChange={(e) => setModalInputName(e.target.value)}
                className="form-input"
                style={{ marginBottom: "16px" }}
                required
              />
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Cập nhật thiệp mời ✨
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body)",
        color: "var(--pastel-blue-700)",
        fontSize: "1.2rem",
        fontWeight: 600
      }}>
        Đang tải thiệp mời tốt nghiệp...
      </div>
    }>
      <InvitationContent />
    </Suspense>
  );
}
