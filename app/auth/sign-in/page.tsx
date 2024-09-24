import SignInForm from "@/components/SignInForm";
import Link from "next/link";

const SignInPage = () => {
  return (
    <div className="container">
      <h1>Sign In</h1>
      <SignInForm />
      <p>
        Don't have an account? <Link href="/auth/sign-up">Sign Up</Link>
      </p>
    </div>
  );
};

export default SignInPage;
