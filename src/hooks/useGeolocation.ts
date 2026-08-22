import { useCallback, useState } from "react";

export interface GeoResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city: string;
  district: string;
  street: string;
}

type GeoStatus = "idle" | "requesting" | "geocoding" | "success" | "denied" | "error";

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [result, setResult] = useState<GeoResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("المتصفح ما يدعم تحديد الموقع");
      return null;
    }

    setStatus("requesting");
    setErrorMessage("");

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      setStatus("geocoding");

      // Reverse geocode using free Nominatim API
      let formattedAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      let city = "";
      let district = "";
      let street = "";

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar&zoom=18`
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          city = addr.city || addr.town || addr.village || addr.state || "";
          district = addr.suburb || addr.neighbourhood || addr.quarter || "";
          street = addr.road || addr.pedestrian || "";
          formattedAddress =
            data.display_name ||
            [street, district, city].filter(Boolean).join("، ") ||
            formattedAddress;
        }
      } catch {
        // Geocoding failed — still have coordinates
      }

      const geoResult: GeoResult = { latitude, longitude, formattedAddress, city, district, street };
      setResult(geoResult);
      setStatus("success");
      return geoResult;
    } catch (err) {
      const geoErr = err as GeolocationPositionError;
      if (geoErr.code === 1) {
        setStatus("denied");
        setErrorMessage("رفضت اذن تحديد الموقع");
      } else if (geoErr.code === 2) {
        setStatus("error");
        setErrorMessage("ما گدرنا نحدد موقعك — تأكد إن الـ GPS مفعّل");
      } else {
        setStatus("error");
        setErrorMessage("خلص الوكت ولا حددنا موقعك — جرب مرة ثانية");
      }
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
  }, []);

  return { status, result, errorMessage, requestLocation, reset };
}
