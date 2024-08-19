import { useEffect, useRef, useState } from "react";
import "./App.css";
import debounce from "./utils/debounce";
import axios from "axios";
import useWebSocket from "react-use-websocket";
import { Flat, Heat, Nested } from "@alptugidin/react-circular-progress-bar";

const App = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("video");
  const [validUrl, setValdUrl] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const userIdRef = useRef(null);

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    "wss://yodel-server.onrender.com"
  );

  const urlHandler = (e) => {
    setUrl(e.target.value);
  };

  const debouncedUrlHandler = debounce(urlHandler, 300);

  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === "USER_ID") {
        userIdRef.current = data.id;
        console.log("id", data.id);
      }

      if (data.type === "PROGRESS") {
        setProgress(Math.round(data.percentage));
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    const youtubeUrlPattern =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|music\.youtube\.com)\/(watch\?v=|embed\/|v\/|.+\?v=)?([a-zA-Z0-9_-]{11})(\S+)?$/;

    setValdUrl(youtubeUrlPattern.test(url));
  }, [url]);

  const onFormatChange = (e) => {
    setFormat(e.target.value);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setProgress(0);
      setIsDownloading(true);
      const response = await axios.post(
        process.env.REACT_APP_API_URL,
        {
          url,
          format,
          id: userIdRef.current,
        },
        { responseType: "blob" }
      );
      const filename = decodeURIComponent(response.headers.get("file-name"));
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename); // Change extension if downloading audio
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.log(error);
    }
    setIsDownloading(false);
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      {isDownloading && (
        <div className="h-screen w-screen wrapper absolute top-0 left-0 z-10 flex justify-center items-center">
          <div className="w-40">
            <Flat
              progress={progress}
              range={{ from: 0, to: 100 }}
              sign={{ value: "", position: "end" }}
              showMiniCircle={false}
              showValue={true}
              sx={{
                strokeColor: "#fff",
                barWidth: 10,
                bgStrokeColor: "#c9c9c9ad",
                bgColor: { value: "#000000", transparency: "00" },
                shape: "full",
                strokeLinecap: "round",
                valueSize: 20,
                valueWeight: "bold",
                valueColor: "#fff",
                valueFamily: "Trebuchet MS",
                textSize: 13,
                textWeight: "bold",
                textColor: "#000000",
                textFamily: "Trebuchet MS",
                loadingTime: 0,
                miniCircleColor: "#ff0000",
                miniCircleSize: 5,
                valueAnimation: true,
                intersectionEnabled: true,
              }}
            />
          </div>
        </div>
      )}
      <form
        onSubmit={onSubmit}
        className="grid gap-y-2 max-w-xl w-full relative"
      >
        <div className="flex gap-x-2 w-full flex-row">
          <input
            type="text"
            className="basis-2/3  mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="Youtube URL"
            onChange={debouncedUrlHandler}
          />
          <select
            name="format"
            value={format}
            onChange={onFormatChange}
            className="basis-1/3 block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="video">Video</option>
            <option value="audio">Audio</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={!validUrl || isDownloading}
          className="disabled:from-purple-400 disabled:to-blue-300 text-white bg-gradient-to-br from-purple-600 to-blue-500 disabled:hover:bg-gradient-to-br hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          {isDownloading ? (
            <div className="flex justify-center items-center">
              <svg
                aria-hidden="true"
                role="status"
                class="inline w-4 h-4 me-3 text-white animate-spin"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="#E5E7EB"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentColor"
                />
              </svg>
              <div>Downloading...</div>
            </div>
          ) : (
            <span>Download</span>
          )}
        </button>
        {url && !validUrl && (
          <div className="justify-self-center text-red-600 absolute top-[105%]">
            Invalid youtube URL
          </div>
        )}
      </form>
    </div>
  );
};
export default App;
