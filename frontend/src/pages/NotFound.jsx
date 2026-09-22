import { Link } from "react-router-dom";
import { FaBook, FaHome } from "react-icons/fa";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function NotFound() {

  return (

    <>
      <Navbar />

      <div className="container not-found">

        <h1>404</h1>

        <p>The page you are looking for does not exist.</p>

        <div className="center-actions">
          <Link to="/" className="btn btn-primary">
            <FaHome />
            Back to Home
          </Link>

          <Link to="/courses" className="btn btn-outline">
            <FaBook />
            View Courses
          </Link>
        </div>

      </div>

      <Footer />
    </>
  );
}

export default NotFound;
