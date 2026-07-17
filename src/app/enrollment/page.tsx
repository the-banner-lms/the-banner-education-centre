import type { Metadata } from 'next'
import EnrollmentForm from '@/components/enrollment/EnrollmentForm'
import EnrollmentStatusLookup from '@/components/enrollment/EnrollmentStatusLookup'

export const metadata: Metadata = {
  title: 'Enrollment | The Banner Education Centre',
  description: 'Enroll a new student or submit a monthly payment to The Banner Education Centre.',
}

export default function EnrollmentPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(140,210,171,0.22),transparent_38%),linear-gradient(180deg,#fbfdfb_0%,#f3f8f4_100%)] px-4 py-14 text-gray-900 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 max-w-3xl sm:mb-14">
          <p className="mb-4 flex items-center gap-3 text-sm font-black uppercase tracking-[0.22em] text-banner-dark">
            <span className="h-px w-10 bg-banner-dark" aria-hidden="true" />
            The Banner Education Centre
          </p>
          <h1 className="text-4xl font-black tracking-tight text-banner-brown sm:text-6xl">Enrollment Form</h1>
          <p className="mt-5 text-base leading-7 text-gray-600 sm:text-lg">
            New student enrollment and monthly tuition payment submissions.
          </p>
        </header>

        <div className="rounded-[2rem] border border-banner-light/30 bg-white p-4 shadow-[0_24px_70px_rgba(15,102,48,0.10)] sm:p-8 lg:p-12">
          <section aria-labelledby="new-enrollment-title" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="font-bold text-banner-dark">သင်တန်းအပ်နှံရန်</p>
            <h2 id="new-enrollment-title" className="mb-3 mt-3 text-2xl font-black text-banner-brown sm:text-4xl">New Student Enrollment</h2>
            <p className="mb-8 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
              Form ဖြည့်ပြီး payment method ရွေးပါ။ Online payment ဖြစ်ပါက slip ပူးတွဲပြီး Direct payment ဖြစ်ပါက slip မလိုပါ။
            </p>
            <EnrollmentForm type="new_enrollment" />
          </section>

          <section aria-labelledby="monthly-payment-title" className="mt-10 border-t border-gray-200 pt-10 sm:mt-14 sm:pt-14">
            <div className="mb-6">
              <p className="font-bold text-banner-dark">လစဉ်သင်တန်းကြေး ပေးသွင်းရန်</p>
              <h2 id="monthly-payment-title" className="mt-3 text-2xl font-black leading-tight text-banner-brown sm:text-4xl">
                Monthly Payment
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
                သင်တန်းတွင် တက်ရောက်နေသော ကျောင်းသားများ လစဉ်သင်တန်းကြေးပေးသွင်းပြီးကြောင်း slip ပို့ပေးရန်။
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
              <EnrollmentForm type="monthly_payment" />
            </div>
          </section>
        </div>

        <section className="mt-10 sm:mt-14" aria-label="Check enrollment or payment review status">
          <EnrollmentStatusLookup />
        </section>
      </div>
    </div>
  )
}
