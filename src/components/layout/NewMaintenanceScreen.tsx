
import Head from 'next/head';

const NewMaintenanceScreen = () => {
  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }

        body {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #061a14, #0f3d2e, #04110d);
          overflow: hidden;
        }

        body::before,
        body::after {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(26,188,156,0.35), transparent);
          animation: float 6s infinite ease-in-out;
          z-index: 0;
        }

        body::after {
          width: 180px;
          height: 180px;
          bottom: 10%;
          right: 15%;
          animation-delay: 3s;
        }

        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
          100% { transform: translateY(0); }
        }

        .card {
          position: relative;
          z-index: 2;
          width: 90%;
          max-width: 420px;
          padding: 45px 30px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
          text-align: center;
        }

        .gear-box {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-bottom: 20px;
        }

        .gear {
          font-size: 44px;
          animation: spin 3s linear infinite;
          filter: drop-shadow(0 0 8px rgba(26,188,156,0.6));
        }

        .gear.small {
          font-size: 28px;
          animation-direction: reverse;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        h1 {
          color: #ffffff;
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        p {
          color: #cfe9df;
          font-size: 14.5px;
          line-height: 1.7;
        }

        .status {
          margin-top: 22px;
          padding: 12px;
          border-radius: 14px;
          background: linear-gradient(135deg, #1abc9c, #16a085);
          color: #063b2c;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(26,188,156,0.35);
        }

        .footer {
          margin-top: 18px;
          font-size: 12px;
          color: #a5dccc;
          opacity: 0.85;
        }
      `}</style>
      <div className="card">
        <div className="gear-box">
          <div className="gear">⚙️</div>
          <div className="gear small">⚙️</div>
        </div>

        <h1>Under Maintenance</h1>

        <p>
          We are performing scheduled maintenance to improve performance,
          security, and overall experience.
          <br /><br />
          Please check back again shortly.
        </p>

        <div className="status">
          🚀 We’ll Be Back Very Soon
        </div>

        <div className="footer">
          Thank you for your patience 💚
        </div>
      </div>
    </>
  );
};

export default NewMaintenanceScreen;
