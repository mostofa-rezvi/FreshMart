import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 text-center mt-8">
      <div className="container mx-auto">
        &copy; {new Date().getFullYear()} FreshMart. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
