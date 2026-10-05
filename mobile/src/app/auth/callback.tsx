import { Redirect } from "expo-router";

/** The Google sign-in redirect lands here. The code exchange happens in
 *  auth.tsx, so this screen only needs to get out of the way. */
export default function AuthCallback() {
  return <Redirect href="/" />;
}
