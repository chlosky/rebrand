import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { scrollToDownloadApp } from "@/lib/scrollToDownloadApp";

/** Legacy route — send visitors to the homepage download section. */
const GetMobileApp = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
    requestAnimationFrame(() => scrollToDownloadApp());
  }, [navigate]);

  return null;
};

export default GetMobileApp;
