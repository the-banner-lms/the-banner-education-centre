import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-white text-banner-dark">
      {/* Hero Section */}
      <section id="home-intro" className="relative isolate px-6 pt-24 pb-28 lg:px-8 bg-banner-light/10 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="mx-auto max-w-7xl w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10">
            <Image src="/logo.png" alt="The Banner Logo" width={220} height={220} className="mb-6 lg:mb-8 drop-shadow-sm" priority />
            <h1 className="text-4xl font-bold tracking-tight text-banner-dark sm:text-5xl lg:text-6xl mb-6 leading-tight">
              The Banner <br/><span className="text-banner-brown text-3xl sm:text-4xl lg:text-5xl">Nature-based Education</span>
            </h1>
            <p className="text-lg sm:text-xl text-banner-dark/80 font-bold mb-10 max-w-lg tracking-wide">
              NURTURING YOUNG MINDS IN NATURE
            </p>
            <div className="flex items-center gap-x-6">
              <Link
                href="/textbook"
                className="rounded-full bg-banner-dark px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-banner-dark/90 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-banner-dark transition-all duration-300 ease-in-out"
              >
                Explore Bookshelf
              </Link>
            </div>
          </div>
          
          <div className="relative h-[400px] sm:h-[500px] lg:h-[650px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white z-10">
            <Image src="/images/zoo_trip_1.jpg" alt="Children learning in nature" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-banner-dark/40 via-transparent to-transparent"></div>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-banner-light/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-banner-brown/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Sections */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 space-y-24">

        {/* Primary Education */}
        <section id="home-primary" className="bg-banner-dark/5 rounded-3xl p-8 md:p-12 shadow-sm border border-banner-dark/10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative h-[500px] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <Image src="/images/primary.jpg" alt="Primary Education" fill className="object-cover" />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-6 text-banner-dark">Primary Education (Grades 1 to 5) <span className="text-banner-brown text-2xl block mt-2">မူလတန်းပညာရေး</span></h2>
              <p className="text-gray-700 leading-relaxed mb-8 text-lg">
                Our primary curriculum is designed to build a strong foundation in core subjects while maintaining a deep connection with nature and arts. We nurture academic excellence alongside creativity.
              </p>
              <p className="text-gray-600 leading-relaxed font-sans mb-10">
                ကျွန်ုပ်တို့၏ မူလတန်းသင်ရိုးညွှန်းတမ်းသည် အဓိကဘာသာရပ်များတွင် ခိုင်မာသော အခြေခံအုတ်မြစ်ကို တည်ဆောက်ပေးနိုင်ရန်နှင့် သဘာဝတရား၊ အနုပညာတို့နှင့် နက်ရှိုင်းစွာ ချိတ်ဆက်နိုင်ရန် ရည်ရွယ်ရေးဆွဲထားပါသည်။
              </p>
              
              <div className="flex flex-wrap gap-4">
                {['Burmese (မြန်မာစာ)', 'English', 'Casco Math', 'Science', 'Art', 'Music', 'Nature'].map((subject) => (
                  <div key={subject} className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-center transform transition-transform hover:scale-105">
                    <span className="font-bold text-banner-dark text-sm">{subject}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Curriculum */}
        <section id="home-curriculum" className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-banner-dark">Curriculum <span className="text-banner-light text-2xl block mt-2">သင်ရိုးညွှန်းတမ်း</span></h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              In our pre-kindergarten and kindergarten classes, we utilize age-appropriate methods for teaching. We recognize that every child is unique and has their own pace. Our curriculum is grounded in Rudolf Steiner&apos;s philosophy and approaches, while also emphasizing the EYFS curriculum in Myanmar. Our goal is to nurture children for healthy and holistic development.
            </p>
            <p className="text-gray-600 leading-relaxed font-sans">
              Pre-kindergarten နှင့် kindergarten အတန်းများတွင် ကလေးငယ်များ၏ အသက်အရွယ်နှင့် ကိုက်ညီသော သင်ကြားမှုနည်းစနစ်များကို အသုံးပြုပါသည်။ ကလေးတိုင်းသည် ထူးခြားပြီး သူတို့ကိုယ်ပိုင် သင်ယူမှုနှုန်းထားရှိသည်ကို ကျွန်ုပ်တို့ နားလည်လက်ခံပါသည်။ ကျွန်ုပ်တို့၏ သင်ရိုးသည် Rudolf Steiner ၏ ဒဿနနှင့် ချဉ်းကပ်မှုများကို အခြေခံထားပြီး မြန်မာနိုင်ငံ၏ EYFS သင်ရိုးကိုလည်း အလေးထားပါသည်။ ကျွန်ုပ်တို့၏ ရည်ရွယ်ချက်မှာ ကလေးငယ်များ ကျန်းမာပျော်ရွှင်၍ ဘက်စုံဖွံ့ဖြိုးတိုးတက်စေရန် ပြုစုပျိုးထောင်ပေးရန် ဖြစ်ပါသည်။
            </p>
          </div>
          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
            <Image src="/images/holistic.jpg" alt="Holistic Development" fill className="object-cover" />
          </div>
        </section>

        {/* Free Play */}
        <section id="home-free-play" className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
          <div className="order-2 md:order-1 relative h-[400px] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
            <Image src="/images/play.jpg" alt="Learning through play" fill className="object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold mb-6 text-banner-dark">Free Play <span className="text-banner-brown text-2xl block mt-2">လွတ်လပ်စွာကစားခြင်း</span></h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              As you know, play is the essential work of childhood, and learning through experience lays the groundwork for active imagination, problem-solving, and creative thinking. Moreover, the more they play, the healthier they will be. Therefore, our primary activity at school is play. We have postponed academic instruction until primary school.
            </p>
            <p className="text-gray-600 leading-relaxed font-sans">
              ကစားခြင်းသည် ကလေးဘဝ၏ အရေးကြီးဆုံး လုပ်ငန်းစဉ်တစ်ခုဖြစ်ပြီး အတွေ့အကြုံမှတစ်ဆင့် သင်ယူခြင်းက တက်ကြွသော စိတ်ကူးစိတ်သန်း၊ ပြဿနာဖြေရှင်းနိုင်စွမ်းနှင့် ဖန်တီးနိုင်စွမ်းတို့အတွက် အုတ်မြစ်ချပေးပါသည်။ ထို့အပြင် ကစားလေလေ ကျန်းမာလေလေ ဖြစ်ပါသည်။ ထို့ကြောင့် ကျောင်းတွင် ကျွန်ုပ်တို့၏ အဓိကလှုပ်ရှားမှုမှာ ကစားခြင်းဖြစ်ပြီး စာပေသင်ကြားမှုကို မူလတန်းအရွယ်ရောက်မှသာ စတင်ရန် ရွှေ့ဆိုင်းထားပါသည်။
            </p>
          </div>
        </section>

        {/* Seasonal Activities */}
        <section id="home-seasonal" className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-banner-dark">Seasonal Activities <span className="text-banner-light text-2xl block mt-2">ရာသီအလိုက် လှုပ်ရှားမှုများ</span></h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              We go through the three seasons in Myanmar with seasonal activities like gardening, preparing a nature table, looking at flowers in our school yards and seasonal crafts and so on. We want them to be aware of the environment and change the seasons and climate in their environment.
            </p>
            <p className="text-gray-600 leading-relaxed font-sans">
              မြန်မာနိုင်ငံ၏ ရာသီဥတုသုံးပါးကို ဖြတ်သန်းရာတွင် ဥယျာဉ်စိုက်ပျိုးခြင်း၊ သဘာဝပြခန်းလေးများ (Nature table) ပြင်ဆင်ခြင်း၊ ကျောင်းဝင်းအတွင်းရှိ ပန်းများကို လေ့လာခြင်းနှင့် ရာသီအလိုက် လက်မှုပညာများ စသည့် လှုပ်ရှားမှုများကို ပြုလုပ်ပါသည်။ ကလေးငယ်များအား ပတ်ဝန်းကျင်ကို သတိပြုမိစေရန်နှင့် သူတို့၏ ပတ်ဝန်းကျင်ရှိ ရာသီဥတုနှင့် သဘာဝတရား အပြောင်းအလဲများကို သိရှိနားလည်စေရန် ရည်ရွယ်ပါသည်။
            </p>
          </div>
          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
            <Image src="/images/nature.jpg" alt="Connecting with nature" fill className="object-cover" />
          </div>
        </section>

        {/* Hand Work */}
        <section id="home-handwork" className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative h-[400px] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
            <Image src="/images/handwork.jpg" alt="Creative handwork" fill className="object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold mb-6 text-banner-dark">Hand Work <span className="text-banner-brown text-2xl block mt-2">လက်မှုပညာ</span></h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              We do lots of handwork in our daily rhythm. Concentration, small muscle development and hand-eye coordination are all essential precursors to reading and writing. Activities that promote these skills include finger crocheting, modelling with clay (We bought pure clay from Naung Shwe, Shan State), crayoning, watercolour painting and others.
            </p>
            <p className="text-gray-600 leading-relaxed font-sans">
              နေ့စဉ်လှုပ်ရှားမှုများတွင် လက်မှုပညာကို များစွာထည့်သွင်းထားပါသည်။ အာရုံစူးစိုက်မှု၊ ကြွက်သားငယ်များ ဖွံ့ဖြိုးမှုနှင့် မျက်စိ-လက် ပူးပေါင်းဆောင်ရွက်မှုတို့သည် စာဖတ်ခြင်းနှင့် စာရေးခြင်းတို့အတွက် မရှိမဖြစ် လိုအပ်သော အခြေခံများဖြစ်ပါသည်။ ဤစွမ်းရည်များကို မြှင့်တင်ပေးသော လှုပ်ရှားမှုများတွင် လက်ချောင်းဖြင့် သိုးမွှေးထိုးခြင်း၊ ရွှံ့စေးဖြင့် ပုံဖော်ခြင်း၊ ရောင်စုံခဲတံဖြင့် ဆွဲခြင်း၊ ရေဆေးပန်းချီဆွဲခြင်းစသည်တို့ ပါဝင်ပါသည်။
            </p>
          </div>
        </section>

        {/* Storytelling and Singing */}
        <section id="home-storytelling" className="bg-banner-light/10 rounded-3xl p-8 md:p-12 shadow-sm border border-banner-light/20">
          <h2 className="text-3xl font-bold mb-8 text-center text-banner-dark">Storytelling and Singing <span className="text-banner-light text-2xl block mt-2">ပုံပြင်ပြောခြင်းနှင့် သီချင်းဆိုခြင်း</span></h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-gray-700 leading-relaxed mb-6">
                As we inspired Waldorf approaches in our school, we use the method of Waldorf storytelling in our daily rhythm. We create a different story for each month and we do lots of repetition. In this way, the child&apos;s memory is developed along with a sense for beauty and expressiveness of language. Most of the stories we usually use puppets and sometimes we read aloud. We tell Burmese traditional stories, fairy tales, stories from the cultures around the world and our own stories.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                And we sing the songs in circle time, keep away time and many transitions. We use gentle approaches when we do the transitions in our daily rhythm. We sing burmese songs, poems, lullabies and hamming as well.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Most of the story is delivered with our mother tongue, but we frequently sing songs and poems in English.
              </p>
            </div>
            <div>
              <p className="text-gray-600 leading-relaxed mb-6 font-sans">
                ကျွန်ုပ်တို့ကျောင်းသည် Waldorf ချဉ်းကပ်မှုကို အားကျအတုယူထားသည့်အတွက် နေ့စဉ်လှုပ်ရှားမှုများတွင် Waldorf ပုံပြင်ပြောခြင်းနည်းစနစ်ကို အသုံးပြုပါသည်။ လတစ်လအတွက် ပုံပြင်တစ်ပုဒ် ဖန်တီးပြီး ထပ်ခါတလဲလဲ ပြောပြလေ့ရှိပါသည်။ ဤနည်းအားဖြင့် ကလေး၏ မှတ်ဉာဏ်ဖွံ့ဖြိုးလာသည့်အပြင် ဘာသာစကား၏ အလှတရားနှင့် ဖော်ပြနိုင်စွမ်းကိုပါ သိရှိခံစားလာနိုင်ပါသည်။ ပုံပြင်အများစုအတွက် ရုပ်သေးရုပ်များကို အသုံးပြုပြီး တစ်ခါတစ်ရံ အသံထွက်ဖတ်ပြပါသည်။ မြန်မာ့ရိုးရာ ပုံပြင်များ၊ ဒဏ္ဍာရီများ၊ ကမ္ဘာတစ်ဝှမ်းမှ ယဉ်ကျေးမှုပုံပြင်များနှင့် မိမိတို့ကိုယ်တိုင် ဖန်တီးထားသော ပုံပြင်များကို ပြောပြပါသည်။
              </p>
              <p className="text-gray-600 leading-relaxed font-sans mb-6">
                စက်ဝိုင်းပုံထိုင်ချိန် (Circle time)၊ ပစ္စည်းသိမ်းချိန် နှင့် ကူးပြောင်းချိန်များတွင် သီချင်းများ သီဆိုကြပါသည်။ ကူးပြောင်းချိန်များတွင် နူးညံ့သိမ်မွေ့သော ချဉ်းကပ်မှုများကို အသုံးပြုပါသည်။ မြန်မာသီချင်းများ၊ ကဗျာများ၊ သီချင်းချော့တေးများနှင့် ညည်းတေး (Humming) များကိုလည်း သီဆိုကြပါသည်။
              </p>
              <p className="text-gray-600 leading-relaxed font-sans">
                ပုံပြင်အများစုကို မိခင်ဘာသာစကားဖြင့် ပြောပြသော်လည်း အင်္ဂလိပ်သီချင်းများနှင့် ကဗျာများကိုလည်း မကြာခဏ သီဆိုလေ့ကျင့်ပေးပါသည်။
              </p>
            </div>
          </div>
        </section>

        {/* Sustainability and Nature-based Environment */}
        <section id="home-sustainability" className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-banner-dark">Sustainability and Nature-based Environment <span className="text-banner-light text-2xl block mt-2">ရေရှည်တည်တံ့မှုနှင့် သဘာဝအခြေခံ ပတ်ဝန်းကျင်</span></h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Our school is located in Myanmar,Asia. Our school setting is surrounded by nature in the community. And the materials and products used are mainly natural, human and environmental friendly, fed with healthy food, and playing with toys from natural materials- wooden blocks, shells, cloth, pinecones and wood..etc, contribute to the children&apos;s connection with as well as appreciation of nature.
            </p>
            <p className="text-gray-600 leading-relaxed font-sans">
              ကျွန်ုပ်တို့ကျောင်းသည် အာရှတိုက်၊ မြန်မာနိုင်ငံတွင် တည်ရှိပြီး ကျောင်းပတ်ဝန်းကျင်မှာ သဘာဝတရားများဖြင့် ဝန်းရံထားပါသည်။ အသုံးပြုသော ပစ္စည်းများနှင့် ထုတ်ကုန်များသည် အဓိကအားဖြင့် သဘာဝပစ္စည်းများ၊ လူသားနှင့် ပတ်ဝန်းကျင်ကို ထိခိုက်မှုမရှိစေသော ပစ္စည်းများဖြစ်ပါသည်။ ကျန်းမာရေးနှင့် ညီညွတ်သော အစားအစာများကို ကျွေးမွေးပြီး သစ်သားတုံးများ၊ ခရုခွံများ၊ အဝတ်အထည်များ၊ ထင်းရှူးသီးများနှင့် သစ်သားစသည့် သဘာဝပစ္စည်းများဖြင့် ပြုလုပ်ထားသော အရုပ်များဖြင့် ကစားစေခြင်းဖြင့် ကလေးငယ်များအား သဘာဝတရားနှင့် ချိတ်ဆက်မိစေရန်နှင့် တန်ဖိုးထားတတ်စေရန် ကူညီပေးပါသည်။
            </p>
          </div>
          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
            <Image src="/images/group.jpg" alt="Eco-friendly learning" fill className="object-cover" />
          </div>
        </section>

        {/* Faculty */}
        <section id="home-faculty" className="bg-banner-brown/5 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <h2 className="text-3xl font-bold mb-8 text-banner-dark relative z-10">Faculty in Nature-based Education <span className="text-banner-brown text-2xl block mt-2">သဘာဝအခြေခံပညာရေးမှ ဆရာ၊ ဆရာမများ</span></h2>
          <div className="max-w-5xl mx-auto space-y-12 relative z-10">
            <div className="bg-white/90 backdrop-blur-sm p-8 md:p-10 rounded-2xl shadow-sm">
              <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                The faculty at our nature-based school includes wildlife experts, housewives, the expert of machines, crafty and early childhood educators. The Banner teachers come from many walks of life and are united in their endeavour to provide holistic, healing Waldorf inspired education and to nurture a clear and responsible sense of self in children. In becoming teachers, all are bound with a commitment to try their best in developing themselves in order to become good role models for the children.
              </p>
              <p className="text-gray-600 leading-relaxed font-sans text-lg">
                ကျွန်ုပ်တို့ သဘာဝအခြေခံကျောင်းမှ ဆရာ၊ ဆရာမများတွင် တောရိုင်းတိရစ္ဆာန် ကျွမ်းကျင်သူများ၊ အိမ်ရှင်မများ၊ စက်မှုကျွမ်းကျင်သူများ၊ လက်မှုပညာရှင်များနှင့် အစောပိုင်း ကလေးသူငယ် ပညာရေးပညာရှင်များ ပါဝင်ပါသည်။ The Banner မှ ဆရာ၊ ဆရာမများသည် ဘဝနယ်ပယ်အသီးသီးမှ လာကြသူများဖြစ်ပြီး ကလေးငယ်များအတွက် ဘက်စုံလွှမ်းခြုံမှုရှိပြီး ကုစားမှုပေးနိုင်သော Waldorf အခြေခံပညာရေးကို ပံ့ပိုးပေးရန်နှင့် ကလေးများတွင် ရှင်းလင်းပြတ်သားပြီး တာဝန်ယူမှုရှိသော ကိုယ်ရည်ကိုယ်သွေးများ ရှင်သန်လာစေရန် အတူတကွ ပူးပေါင်းကြိုးပမ်းကြပါသည်။ ဆရာ၊ ဆရာမများ ဖြစ်လာသည့်အခါ ကလေးများအတွက် စံပြပုဂ္ဂိုလ်ကောင်းများ ဖြစ်လာစေရန် မိမိကိုယ်ကို အစဉ်အမြဲ ဖွံ့ဖြိုးတိုးတက်အောင် အကောင်းဆုံးကြိုးစားမည်ဟု ကတိကဝတ်ပြုထားကြပါသည်။
              </p>
            </div>
            
            <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white mt-8 transform hover:scale-[1.02] transition-transform duration-500">
              <Image src="/images/lower-section.png" alt="Our amazing faculty and learning environment" fill className="object-cover" />
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-banner-dark text-banner-light py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-center justify-center text-center">
          <div className="bg-white p-4 rounded-full mb-6">
            <Image src="/logo.png" alt="The Banner Logo" width={80} height={80} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">The Banner</h2>
          <p className="text-banner-light font-semibold tracking-widest uppercase">Nature-Based Education</p>
          <div className="mt-8 border-t border-banner-light/20 pt-8 w-full max-w-2xl text-sm text-banner-light/60">
            <p>&copy; {new Date().getFullYear()} The Banner Education Centre. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
