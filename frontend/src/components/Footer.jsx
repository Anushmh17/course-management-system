import { Link } from "react-router-dom";
import {
  FaBook,
  FaEnvelope,
  FaHome,
  FaMapMarkerAlt,
  FaPhone,
  FaSignInAlt,
} from "react-icons/fa";


function Footer() {

  // new Date().getFullYear() keeps the copyright year correct
  const year = new Date().getFullYear();

  return (

    <footer className="footer">

      <div className="footer-inner">

        <div className="footer-column">
          <h4>Course Management System</h4>
          <p>
            A full stack learning platform built with React,
            Express and MySQL.
          </p>
        </div>


        <div className="footer-column">
          <h4>Quick Links</h4>

          <ul>
            <li>
              <Link to="/"><FaHome /> Home</Link>
            </li>

            <li>
              <Link to="/courses"><FaBook /> Courses</Link>
            </li>

            <li>
              <Link to="/login"><FaSignInAlt /> Login</Link>
            </li>
          </ul>
        </div>


        <div className="footer-column">
          <h4>Contact</h4>

          <ul>
            <li><FaEnvelope /> info@cms.local</li>
            <li><FaPhone /> +94 11 234 5678</li>
            <li><FaMapMarkerAlt /> Colombo, Sri Lanka</li>
          </ul>
        </div>

      </div>


      <div className="footer-bottom">
        © {year} Course Management System. All rights reserved.
      </div>

    </footer>
  );
}

export default Footer;
