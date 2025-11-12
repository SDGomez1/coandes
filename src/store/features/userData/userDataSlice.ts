import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface userDataState {
  email: string;
  registerType?: "email" | "phone";
  authState?: "login" | "signUp";
}

const initialState: userDataState = { email: "" };

export const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    setUserEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },

    setRegisterType: (state, action: PayloadAction<"email" | "phone">) => {
      state.registerType = action.payload;
    },
    setAuthState: (state, action: PayloadAction<"login" | "signUp">) => {
      state.authState = action.payload;
    },
  },
});

export const { setUserEmail, setRegisterType, setAuthState } =
  userDataSlice.actions;

export default userDataSlice.reducer;
