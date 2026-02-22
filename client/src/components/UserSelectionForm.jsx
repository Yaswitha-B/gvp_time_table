import React, { useState } from "react";

const UserSelectionForm = () => {
  const [formData, setFormData] = useState({
    branch: "",
    year: "",
    semester: "",
    section: "",
    userType: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Academic Details</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid">
            <select name="branch" onChange={handleChange} required>
              <option value="">Select Branch</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              
            </select>

            <select name="year" onChange={handleChange} required>
              <option value="">Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>

            <select name="semester" onChange={handleChange} required>
              <option value="">Select Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>

            <select name="section" onChange={handleChange} required>
              <option value="">Select Section</option>
              <option value="A">Section 1</option>
              <option value="B">Section 2</option>
              <option value="C">Section 3</option>
              <option value="D">Section 4</option>
            </select>
          </div>

          <div className="userType">
            <label>
              <input type="radio" name="userType" value="admin" onChange={handleChange} required />
              Admin
            </label>

            <label>
              <input type="radio" name="userType" value="student" onChange={handleChange} />
              Student
            </label>

            <label>
              <input type="radio" name="userType" value="teacher" onChange={handleChange} />
              Teacher
            </label>
          </div>

          <button type="submit">Proceed</button>
        </form>
      </div>

      <style>{`
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #1e3c72, #2a5298);
        }

        .card {
          background: white;
          padding: 40px;
          border-radius: 15px;
          width: 450px;
          box-shadow: 0px 10px 30px rgba(0,0,0,0.2);
          text-align: center;
        }

        h2 {
          margin-bottom: 25px;
          color: #1e3c72;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }

        select {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #ccc;
          font-size: 14px;
        }

        .userType {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
        }

        button {
          width: 100%;
          padding: 12px;
          background: #1e3c72;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: 0.3s;
        }

        button:hover {
          background: #16325c;
        }
      `}</style>
    </div>
  );
};

export default UserSelectionForm;