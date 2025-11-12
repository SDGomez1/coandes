import Image from "next/image";
import Logo from "@/assets/img/Logo.png";
import BGImage from "@/assets/img/login.webp";
import { Separator } from "@/components/ui/separator";

import Link from "next/link";
import VerifyOtpForm from "@/components/auth/verifyOtpForm";

export default function Page() {
  return (
    <section className="flex w-full overflow-y-hidden ">
      <div className="w-1/2 relative hidden lg:block h-screen">
        <div className="w-full h-full bg-black opacity-60 absolute"></div>
        <Image src={BGImage} alt="logo" className="w-full " />
      </div>
      <div className="lg:w-1/2 flex flex-col py-11 lg:px-20 px-6">
        <div className="flex items-center justify-center max-w-screen ">
          <span className="bg-primary size-10 lg:size-16 rounded-full flex justify-center items-center text-white  text-lg lg:text-2xl font-medium shrink-0">
            1
          </span>
          <Separator className="bg-primary shrink" />
          <Separator className="shrink bg-primary" />
          <span className="bg-primary border border-primary size-10 lg:size-16 rounded-full flex justify-center items-center text-white text-lg lg:text-2xl font-medium shrink-0">
            2
          </span>
        </div>
        <Image src={Logo} alt="logo" className="h-auto w-56 my-14" />
        <p className="font-medium text-gray-ligth mb-4">Bienvenido,</p>
        <h2 className="font-semibold text-black-ligth text-4xl mb-5">
          Revisa tu email
        </h2>
        <VerifyOtpForm />
        <Separator className="bg-primary/40" />
        <Link
          href={"/"}
          className="h-16 mt-9 w-full border  rounded-lg text-primary flex justify-center items-center gap-2 border-primary"
        >
          Cambiar correo electrónico
        </Link>
      </div>
    </section>
  );
}
