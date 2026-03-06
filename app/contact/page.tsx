"use client";
import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { MapPin, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: "",
  });

  return (
    <main>
      <Navbar solid />

      {/* ================= HERO ================= */}
      <section className="pt-28 pb-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-8 text-center space-y-6">
          <p className="uppercase tracking-[0.3em] text-xs font-semibold text-blue-600">
            Contact Us
          </p>

          <h1 className="text-5xl font-serif font-bold bg-gradient-to-r from-black via-gray-400 to-blue-800 bg-[length:200%_200%] animate-gradient bg-clip-text text-transparent">
            Get in Touch with Our Clinic
          </h1>

          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Have questions or need assistance? We’re here to help you schedule
            your visit easily.
          </p>
        </div>
      </section>

      {/* ================= CONTACT INFO ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16">

          {/* LEFT SIDE - Contact Info */}
          <div className="space-y-8">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <MapPin size={20} />
              </div>
              <h2 className="text-3xl font-serif font-bold bg-gradient-to-r from-black via-gray-600 to-blue-300 animate-gradient bg-clip-text text-transparent">
                Visit Smile Guru  Dentistry
              </h2>
            </div>


            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>📍 303/304 pramukh orbit 2 opposit L P savani academy, Vesu Canal Rd, near Cellestial Dreams, Surat, Gujarat 395007</p>

              <p>
                🕒 Mon-Sat: 10AM-1PM (Vesu) & 4PM-8PM (Kamrej)<br />
                ❌ Closed Sundays
              </p>

              <p>📞 +91 72111 77727</p>
            </div>

            <div className="flex gap-4 pt-4">
              <a
                href="https://wa.me/917211177727"
                target="_blank"
                className="px-6 py-3 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
              >
                WhatsApp
              </a>

              <a
                href="/book"
                className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                Book Appointment
              </a>
            </div>

            {/* Map */}
            <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200 mt-8">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d4249.850481570892!2d72.78499927379372!3d21.145846742665977!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be0533d348df059%3A0x2446751d1258df52!2sSmile%20Guru!5e1!3m2!1sen!2sin!4v1771996766752!5m2!1sen!2sin"
                width="100%"
                height="300"
                loading="lazy"
                className="w-full"
              ></iframe>
            </div>
          </div>

          {/* RIGHT SIDE - Contact Form */}
          <div className="bg-gray-50 p-10 rounded-3xl shadow-sm border border-gray-200 relative min-h-[460px]">


            {sent ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl mb-4">
                  🎉
                </div>

                <h3 className="text-2xl font-serif font-bold text-gray-900">
                  Message Sent Successfully
                </h3>

                <p className="text-gray-500 mt-2 max-w-sm">
                  Thank you for contacting us. Our team will reach out shortly.
                </p>

                <button
                  onClick={() => setSent(false)}
                  className="mt-6 px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Send Another Message
                </button>

                <div className="mt-20">
                  <a
                    href="/"
                    className="mt-10 px-6 py-2 rounded-xl bg-gray-300 text-black hover:bg-gray-400 transition"
                  >
                    Back to Home
                  </a>
                </div>
              </div>
            ) : (


              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Mail size={20} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold bg-gradient-to-r from-black via-gray-600 to-blue-300 animate-gradient bg-clip-text text-transparent">
                    Send Us a Message
                  </h3>
                </div>


                <div className="space-y-6">

                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition placeholder-gray-400 text-gray-900"
                    />
                  </div>


                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Enter 10-digit number"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          phone: e.target.value.replace(/\D/g, ""), // removes letters
                        })
                      }
                      className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition placeholder-gray-400 text-gray-900"
                    />
                  </div>



                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Your Message
                    </label>
                    <textarea
                      rows={4}
                      placeholder="How can we help you?"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition placeholder-gray-400 text-gray-900 resize-none"
                    />
                  </div>


                </div>

                {/* Button */}
                <button
                  onClick={async () => {
                    // 1. Validation
                    if (!form.name.trim()) {
                      alert("Please enter your full name.");
                      return;
                    }
                    if (!/^[6-9]\d{9}$/.test(form.phone)) {
                      alert("Please enter a valid 10-digit phone number.");
                      return;
                    }
                    if (!form.message.trim()) {
                      alert("Please enter your message.");
                      return;
                    }

                    setLoading(true);

                    try {
                      // 2. Direct Insert to Supabase
                      // Make sure you create a table named 'contact_messages'
                      const { error } = await supabase
                        .from('contact_messages')
                        .insert([form]);

                      if (!error) {
                        setSent(true);
                      } else {
                        console.error(error);
                        alert("Could not send message. Please check your internet.");
                      }
                    } catch (err) {
                      console.error("Connection error:", err);
                      alert("Server error. Please check your internet.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 ${loading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
                <div className="mt-20">
                  <a
                    href="/"
                    className="mt-10 px-6 py-2 rounded-xl bg-gray-300 text-black hover:bg-gray-400 transition"
                  >
                    Back to Home
                  </a>
                </div>

              </>
            )}

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
