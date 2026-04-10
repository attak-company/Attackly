import Image from "next/image";

export default function Icon() {
  return (
    <Image
      src="/Logo.png"
      alt="Digital Manager Logo"
      width={96}
      height={96}
      priority
    />
  );
}
