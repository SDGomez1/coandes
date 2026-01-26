import { ConfigPage } from "@/components/dashboard/config/ConfigPage";
import { api } from "../../../../convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";
import { Id } from "../../../../convex/betterAuth/_generated/dataModel";

async function Config() {
  const userData = await fetchAuthQuery(api.user.getUserData);

  if (!userData) {
    return <div>Loading...</div>;
  }

  const typedUserData = {
    ...userData,
    userId: userData?._id as Id<"user">,
  };

  return (
    <div className="p-4 md:p-10">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      <ConfigPage userData={typedUserData} />
    </div>
  );
}

export default Config;
