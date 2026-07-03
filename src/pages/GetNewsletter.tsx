import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { scrollToNewsletter } from "@/lib/scrollToNewsletter";

/** Email-friendly route — sends visitors to the homepage newsletter signup. */
const GetNewsletter = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
    requestAnimationFrame(() => scrollToNewsletter());
  }, [navigate]);

  return null;
};

export default GetNewsletter;
