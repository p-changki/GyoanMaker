import "@auth/core/jwt";
import "@auth/core/types";

declare module "@auth/core/types" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      approved: boolean;
      userStatus: "pending" | "approved" | "rejected";
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    approved?: boolean;
    userStatus?: "pending" | "approved" | "rejected";
  }
}
