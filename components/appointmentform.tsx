"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const services = [
  "Dental Fillings",
  "Braces & Aligners",
  "Root Canal",
  "Teeth Whitening",
  "Dental Implants",
  "Pediatric Dentistry",
  "Dentures",
  "Cosmetic Dentistry",
  "Cosmetic Surgery",
  "Jaw Surgery",
];

const slots = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

export default function AppointmentForm() {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    service: "",
    date: "",
    time: "",
    name: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ✅ Helper: Check Sunday
  function isSunday(dateString: string) {
    const d = new Date(dateString);
    return d.getDay() === 0;
  }

  // ✅ Helper: Filter past slots if booking today
  function getAvailableSlots() {
    if (!form.date) return [];

    // ❌ Sunday = No slots
    if (isSunday(form.date)) return [];

    const selectedDate = new Date(form.date);
    const today = new Date();

    // If NOT today → show all slots
    if (selectedDate.toDateString() !== today.toDateString()) {
      return slots;
    }

    // If TODAY → remove past slots
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    return slots.filter((slot) => {
      const [time, meridian] = slot.split(" ");
      let [hour, minute] = time.split(":").map(Number);

      // Convert to 24-hour format
      if (meridian === "PM" && hour !== 12) hour += 12;
      if (meridian === "AM" && hour === 12) hour = 0;

      // Keep only future slots
      if (hour > currentHour) return true;
      if (hour === currentHour && minute > currentMinute) return true;

      return false;
    });
  }

  function next() {
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => s - 1);
  }

  async function submitBooking() {
    // 1. Validation
    if (!form.name.trim()) {
      alert("Please enter your full name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!form.time) {
      alert("Please select a valid time slot.");
      return;
    }

    // 2. Start Loading
    setLoading(true);

    try {
      // 3. Send to Supabase
      const { error } = await supabase
        .from('appointments')
        .insert([form]);

      if (error) {
        console.error("Error saving to Supabase:", error);
        alert("Could not save appointment. Please check your internet.");
      } else {
        // 4. Success!
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred.");
    } finally {
      // 5. Always stop loading at the end
      setLoading(false);
    }
  }

  // ✅ Success Screen
  if (submitted) {
    return (
      <div className="space-y-8 text-center">
        <h2 className="text-3xl font-bold text-green-600">
          🎉 Appointment Request Sent
        </h2>

        <p className="text-gray-600 text-lg">
          Thank you <b>{form.name}</b>. We will contact you shortly.
        </p>

        {/* WhatsApp Button */}
        <a
          href={`https://wa.me/917211177727`}
          target="_blank"
          className="block w-full bg-green-600 text-white py-4 rounded-2xl font-semibold hover:bg-green-700 transition"
        >
          Message Clinic on WhatsApp
        </a>

        {/* Home Button */}
        <a
          href="/"
          className="block w-full bg-gray-100 text-gray-800 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition"
        >
          Back to Home
        </a>
      </div>
    );
  }


  return (
    <div className="max-w-xl w-full space-y-10">
      {/* Step Header */}
      <div>
        <p className="text-sm uppercase tracking-widest text-gray-400">
          Step {step} of 4
        </p>

        <h2 className="text-4xl font-serif font-bold text-gray-900 mt-2">
          {step === 1 && "Choose a Service"}
          {step === 2 && "Select a Date"}
          {step === 3 && "Pick a Time Slot"}
          {step === 4 && "Enter Your Details"}
        </h2>
      </div>

      {/* STEP 1: Service */}
      {step === 1 && (
        <div>
          <div className="grid grid-cols-2 gap-4">
            {services.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setForm({ ...form, service: s });
                  next();
                }}
                className={`p-5 rounded-2xl border text-left transition
  ${form.service === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-900 hover:border-blue-600 hover:bg-blue-50"}
`}
              >
                {s}
              </button>
            ))}
          </div>
          <a
            href="/"
            className="block w-full bg-gray-100 text-gray-800 px-6 py-4 pt-3 mt-5 rounded-2xl font-semibold hover:bg-gray-200 transition"
          >
            Back to Home
          </a>
        </div>
      )}

      {/* STEP 2: Date */}
      {step === 2 && (
        <div className="space-y-4">
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]} // ✅ No past dates
            value={form.date}
            onChange={(e) =>
              setForm({
                ...form,
                date: e.target.value,
                time: "", // ✅ Reset time when date changes
              })
            }
            className="w-full px-5 py-5 border rounded-2xl text-lg text-gray-900
           appearance-none
           focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* ❌ Sunday Warning */}
          {form.date && isSunday(form.date) && (
            <p className="text-sm text-red-500">
              Clinic is closed on Sundays. Please choose another day.
            </p>
          )}

          <div className="flex justify-between">
            <button
              onClick={back}
              className="text-gray-500 hover:text-gray-800"
            >
              Back
            </button>

            <button
              onClick={next}
              disabled={!form.date || isSunday(form.date)} // ❌ Block Sunday
              className="bg-blue-600 text-white px-8 py-4 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 rounded-2xl font-semibold disabled:bg-gray-300"
            >
              Continue
            </button>
          </div>

          <a
            href="/"
            className="block w-full bg-gray-100 text-gray-800 px-6 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition"
          >
            Back to Home
          </a>
        </div>
      )}

      {/* STEP 3: Time Slots */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-4">
            {getAvailableSlots().map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, time: t })}
                className={`py-4 rounded-2xl border transition ${form.time === t
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-900 hover:bg-blue-50 hover:border-blue-400"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* No slots message */}
          {getAvailableSlots().length === 0 && (
            <p className="text-sm text-red-500">
              No available slots for this day. Please choose another date.
            </p>
          )}

          {/* Buttons */}
          <div className="flex justify-between">
            <button
              onClick={back}
              className="text-gray-500 hover:text-gray-800"
            >
              Back
            </button>

            <button
              onClick={next}
              disabled={!form.time} // ✅ MUST select time
              className="bg-blue-600 text-white px-8 py-4 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 max-[400px]:px-6 max-[400px]:py-3 rounded-2xl font-semibold disabled:bg-gray-300"
            >
              Continue
            </button>
          </div>

          <a
            href="/"
            className="block w-full bg-gray-100 text-gray-800 px-6 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition"
          >
            Back to Home
          </a>

          {/* Warning */}
          {!form.time && (
            <p className="text-sm text-gray-500">
              Please select a time slot to continue.
            </p>
          )}
        </div>
      )}


      {/* STEP 4: Details */}
      {step === 4 && (
        <div className="space-y-5">
          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full p-5 border rounded-2xl
           text-gray-900 placeholder:text-gray-500
           focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            placeholder="Phone Number"
            type="tel"
            maxLength={10}
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })
            }
            className="w-full p-5 border rounded-2xl
           text-gray-900 placeholder:text-gray-500
           focus:outline-none focus:ring-2 focus:ring-blue-500"
          />


          <div className="flex justify-between items-center">
            <button onClick={back} className="text-gray-500 hover:text-gray-800">
              Back
            </button>

            <button
              onClick={submitBooking}
              disabled={loading || !form.name || !form.phone}
              className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-semibold disabled:bg-gray-300"
            >
              {loading ? "Booking..." : "Confirm"}
            </button>
          </div>
          <a
            href="/"
            className="block w-full bg-gray-100 text-gray-800 px-6 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition"
          >
            Back to Home
          </a>
        </div>
      )}
    </div>
  );
}
