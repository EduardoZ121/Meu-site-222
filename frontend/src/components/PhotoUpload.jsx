import InstantPhotoUpload from "./studio/InstantPhotoUpload";
import { IMAGE_ACCEPT } from "../lib/imageCompress";

/** Gerar — preview instantâneo; envio da foto só ao carregar em Gerar. */
export default function PhotoUpload(props) {
  return <InstantPhotoUpload {...props} />;
}
