import React from 'react';
import { resolveVideoUrl } from '../../utils/videoUrl';

/**
 * Video player dùng đường dẫn tương đối để request cùng origin.
 * Backend trả /uploads/videos/xxx.mp4 -> proxy chuyển tiếp, không lỗi CORS.
 */
const VideoPlayer = ({ src, className, onEnded, controls = true, controlsList = 'nodownload', ...props }) => {
  const resolvedSrc = resolveVideoUrl(src);
  if (!resolvedSrc) return null;
  return (
    <video
      src={resolvedSrc}
      controls={controls}
      controlsList={controlsList}
      className={className}
      onEnded={onEnded}
      {...props}
    >
      <source src={resolvedSrc} type="video/mp4" />
    </video>
  );
};

export default VideoPlayer;
