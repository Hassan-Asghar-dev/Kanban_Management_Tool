import React from "react";
import { FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaFacebook, FaTwitter, FaLinkedin, FaClock } from "react-icons/fa";

const Contact = () => {
  return (
    <div className="max-w-6xl mx-auto p-8 bg-purple text-white rounded-lg shadow-lg text-center"
    style={{ backgroundColor:"rgb(23,21,18)"}}
    >
      <h2 className="text-4xl font-bold text-[#00df9a] mb-6">📞 Contact Us</h2>

      {/* Flex Container for Contact Details & Map */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Contact Details - Smaller Width */}
        <div className="w-full md:w-1/3 space-y-6 text-left">
          <div className="flex items-center space-x-3">
            <FaMapMarkerAlt className="text-[#00df9a] text-2xl" />
            <p className="text-lg">Office: Blue Area, Islamabad, Pakistan</p>
          </div>
          <div className="flex items-center space-x-3">
            <FaEnvelope className="text-[#00df9a] text-2xl" />
            <a href="mailto:kanbanize22@gmail.com" className="text-lg hover:text-[#00b882] transition duration-300">
              kanbanize22@gmail.com
            </a>
          </div>
          <div className="flex items-center space-x-3">
            <FaPhoneAlt className="text-[#00df9a] text-2xl" />
            <p className="text-lg">+92 123 456 7890</p>
          </div>
          <div className="flex items-center space-x-3">
            <FaClock className="text-[#00df9a] text-2xl" />
            <p className="text-lg">Office Hours: Mon - Fri (9:00 AM - 6:00 PM)</p>
          </div>

          {/* Social Media Links */}
          <div className="mt-6 flex space-x-6 text-2xl">
            <a href="https://facebook.com" className="text-[#00df9a] hover:text-[#00b882] transition duration-300">
              <FaFacebook />
            </a>
            <a href="https://twitter.com" className="text-[#00df9a] hover:text-[#00b882] transition duration-300">
              <FaTwitter />
            </a>
            <a href="https://linkedin.com" className="text-[#00df9a] hover:text-[#00b882] transition duration-300">
              <FaLinkedin />
            </a>
          </div>
        </div>

        {/* Bigger Interactive Google Map */}
        <div className="w-full md:w-2/3 rounded-lg overflow-hidden shadow-lg">
          <iframe
            title="Islamabad Location"
            className="w-full h-[100px] md:h-[300px]"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3319.452244771949!2d73.0478827152082!3d33.68442028071006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38dfc0906c1f0e0b%3A0x22f8ef4c59d22d8b!2sBlue%20Area%2C%20Islamabad!5e0!3m2!1sen!2s!4v1649573089863!5m2!1sen!2s"
            allowFullScreen
            loading="lazy"
            style={{ border: 0 }}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default Contact;
