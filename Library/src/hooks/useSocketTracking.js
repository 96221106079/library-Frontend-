import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

const useSocketTracking = (bookId, isOwner) => {
  const socketRef = useRef(null);
  const [remoteLocation, setRemoteLocation] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.emit("join-tracking", bookId);

    if (isOwner) {
      // Owner: Start watching and broadcasting location
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            socketRef.current.emit("update-location", { bookId, lat, lng });
          },
          (err) => console.error("Geolocation watch error:", err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    } else {
      // Borrower: Listen for updates
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

  return { remoteLocation };
};

export default useSocketTracking;
