import React from "react";
import Form from "../components/Form";
import "../styles/Signup.css";

export default function Signup() {
  return (
    <div className="signup-page">
      <header className="signup-header">
        <h1 className="app-title">ConnectEd</h1>
      </header>
      <main className="signup-main">
        <Form />
      </main>
    </div>
  );
}
