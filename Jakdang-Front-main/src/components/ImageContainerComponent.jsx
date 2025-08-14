import { useFileApi } from "@/service/api/fileApi";
import { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ImageContainerComponent = ({ post }) => {
  const [media, setMedia] = useState(null);
  const videoRefs = useRef([]);

  const { useGetAllFilesInfo } = useFileApi();
  const {
    data: res,
    isLoading,
    error,
  } = useGetAllFilesInfo(post.id, post.file_ids);

  useEffect(() => {
    if (!isLoading) {
      const data = res?.data;
      const media = data?.filter((file) => file.type === "image" || file.type === "video");
      setMedia(media);
      console.log(media);
    }
  }, [isLoading]);

  useEffect(() => {
    if (media) {
      media.forEach((file, index) => {
        if (file.type === "video" && videoRefs.current[index]) {
          const video = videoRefs.current[index];
          const playVideo = () => {
            video.currentTime = 0;
            video.play();
            setTimeout(() => {
              video.pause();
              playVideo();
            }, 5000); // 10 seconds
          };
          playVideo();
        }
      });
    }
  }, [media]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
      <div className="mb-4 relative w-full rounded-lg overflow-hidden">
        {media && media?.length === 1 ? (
            <>
              {media?.map((file, index) => (
                  <div key={index} className="relative">
                    {file.type === "image" ? (
                        <img
                            src={file.address}
                            alt={post.title}
                            className="w-full h-auto max-h-[450px] object-contain rounded-lg"
                        />
                    ) : (
                        <video
                            ref={(el) => (videoRefs.current[index] = el)}
                            src={file.address}
                            className="w-full h-auto max-h-[450px] object-contain rounded-lg"
                            muted
                            loop
                        />
                    )}
                  </div>
              ))}
            </>
        ) : (
            <>
              <Slider {...settings}>
                {media?.map((file, index) => (
                    <div key={index} className="relative">
                      {file.type === "image" ? (
                          <img
                              src={file.address}
                              alt={post.title}
                              className="w-full h-auto max-h-[450px] object-contain rounded-lg"
                          />
                      ) : (
                          <>
                          <img
                              src={file.thumbnail_address}
                              className="w-full h-auto max-h-[450px] object-contain rounded-lg"
                              muted
                          />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black bg-opacity-50 rounded-full p-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-12 w-12 text-white"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </>
                      )}
                    </div>
                ))}
              </Slider>
            </>
        )}
      </div>
  );
};

export default ImageContainerComponent;