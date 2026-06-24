import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

const useSocketTracking = (bookId, isOwner) => {
  const socketRef = useRef(null);
  const [remoteLocation, setRemoteLocation] = useState(null);
  const watchIdRef = useRef(null);

  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit("join-tracking", bookId);

    // Borrower: Listen for updates
    if (!isOwner) {
      socketRef.current.on("location-updated", (data) => {
        setRemoteLocation(data);
      });
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [bookId, isOwner]);

  const startTracking = () => {
    if (!isOwner || !navigator.geolocation) return;
    setIsTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (socketRef.current) {
          socketRef.current.emit("update-location", { bookId, lat, lng });
        }
      },
      (err) => {
        console.error("Geolocation watch error:", err);
        stopTracking();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  return { remoteLocation, startTracking, stopTracking, isTracking };
};

export default useSocketTracking;
