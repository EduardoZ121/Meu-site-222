import InstantPhotoUpload from "./studio/InstantPhotoUpload";
import MultiImageUpload from "./studio/MultiImageUpload";

/** Gerar — preview instantâneo; envio da foto só ao carregar em Gerar. */
export default function PhotoUpload({ multiple = false, maxFiles = 5, value, onChange, ...props }) {
  if (multiple) {
    return (
      <MultiImageUpload
        value={Array.isArray(value) ? value : value ? [value] : []}
        onChange={onChange}
        maxFiles={maxFiles}
        {...props}
      />
    );
  }
  return <InstantPhotoUpload value={value} onChange={onChange} {...props} />;
}
