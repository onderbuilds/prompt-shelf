(function (root) {
  const pack = {
    "id": "marketing",
    "version": 1,
    "name": {
      "en": "Marketing",
      "tr": "Pazarlama"
    },
    "description": {
      "en": "Positioning, copy, campaigns and research — honest claims only.",
      "tr": "Konumlandırma, metin, kampanya ve araştırma — yalnızca dürüst iddialar."
    },
    "templates": [
      {
        "id": "value-prop",
        "tags": [
          "positioning"
        ],
        "en": {
          "title": "Value proposition canvas",
          "body": "Product: {{product}}\nTarget customer: {{customer}}\n\nFill a value proposition canvas: customer jobs, pains, gains; then pain relievers, gain creators and the products/features that deliver them. Finish with 3 one-sentence value propositions in the format \"For [who] who [need], [product] is [category] that [benefit], unlike [alternative].\" Only use benefits the product really has."
        },
        "tr": {
          "title": "Değer önerisi kanvası",
          "body": "Ürün: {{ürün}}\nHedef müşteri: {{müşteri}}\n\nBir değer önerisi kanvası doldur: müşteri işleri, acıları, kazançları; sonra acı gidericiler, kazanç yaratıcılar ve bunları sağlayan özellikler. \"[Kim] için, [ihtiyaç] duyan, [ürün] bir [kategori] olup [fayda] sağlar, [alternatif]ten farklı olarak.\" biçiminde 3 tek cümlelik değer önerisiyle bitir. Yalnızca ürünün gerçekten sahip olduğu faydaları kullan."
        }
      },
      {
        "id": "persona",
        "tags": [
          "research"
        ],
        "en": {
          "title": "Customer persona from real signals",
          "body": "Build a customer persona for {{product}} based on these real signals (reviews, interviews, support tickets):\n{{signals}}\n\nInclude: situation, goals, frustrations (quote the signals), buying triggers, objections, where they spend time online, and the words they use. Mark anything that is an assumption rather than evidence."
        },
        "tr": {
          "title": "Gerçek sinyallerden müşteri personası",
          "body": "{{ürün}} için şu gerçek sinyallere (yorumlar, görüşmeler, destek talepleri) dayanarak bir müşteri personası oluştur:\n{{sinyaller}}\n\nŞunları ekle: durum, hedefler, şikayetler (sinyallerden alıntıla), satın alma tetikleyicileri, itirazlar, internette zaman geçirdikleri yerler ve kullandıkları kelimeler. Kanıt değil varsayım olan her şeyi işaretle."
        }
      },
      {
        "id": "landing",
        "tags": [
          "copywriting",
          "web"
        ],
        "en": {
          "title": "Landing page copy",
          "body": "Write landing page copy for {{product}} aimed at {{audience}}.\n\nSections: headline (max 10 words), subheadline, 3 benefit blocks, how it works (3 steps), objection-handling FAQ (4 questions), call to action. Tone: {{tone|plain and confident}}. No fake numbers, testimonials or urgency; leave [PLACEHOLDER] where real proof is needed."
        },
        "tr": {
          "title": "Açılış sayfası metni",
          "body": "{{hedef kitle}} için {{ürün}} açılış sayfası metni yaz.\n\nBölümler: başlık (en fazla 10 kelime), alt başlık, 3 fayda bloğu, nasıl çalışır (3 adım), itirazları yanıtlayan SSS (4 soru), harekete geçirici mesaj. Ton: {{ton|sade ve kendinden emin}}. Sahte rakam, yorum veya aciliyet yok; gerçek kanıt gereken yerlere [YER TUTUCU] bırak."
        }
      },
      {
        "id": "onboarding-emails",
        "tags": [
          "email",
          "lifecycle"
        ],
        "en": {
          "title": "Onboarding email sequence",
          "body": "Write a {{count|4}}-email onboarding sequence for new users of {{product}}.\n\nFor each email: send day, goal, subject line (2 options), preview text, body under {{words|120}} words, one clear call to action. Focus on reaching the first success moment: {{aha_moment}}. Include an easy unsubscribe line."
        },
        "tr": {
          "title": "Karşılama e-posta serisi",
          "body": "{{ürün}} yeni kullanıcıları için {{adet|4}} e-postalık bir karşılama serisi yaz.\n\nHer e-posta için: gönderim günü, amaç, konu satırı (2 seçenek), önizleme metni, {{kelime|120}} kelimeden kısa gövde ve tek bir net harekete geçirici mesaj. İlk başarı anına ulaşmaya odaklan: {{başarı anı}}. Kolay abonelikten çıkma satırı ekle."
        }
      },
      {
        "id": "cold-email",
        "tags": [
          "email",
          "outreach"
        ],
        "en": {
          "title": "Honest cold outreach email",
          "body": "Write a short cold email to {{recipient_role}} at {{company_type}} about {{offer}}.\n\nRules: under 110 words, one specific observation about their situation ({{observation|leave a placeholder}}), one clear ask, no flattery, no fake familiarity, no pressure. Give 3 subject lines and a polite one-line follow-up for 5 days later."
        },
        "tr": {
          "title": "Dürüst soğuk e-posta",
          "body": "{{şirket türü}} şirketindeki {{alıcı rolü}} kişisine {{teklif}} hakkında kısa bir soğuk e-posta yaz.\n\nKurallar: 110 kelimeden az, durumlarıyla ilgili tek bir somut gözlem ({{gözlem|yer tutucu bırak}}), tek net istek, dalkavukluk yok, sahte samimiyet yok, baskı yok. 3 konu satırı ve 5 gün sonrası için kibar, tek satırlık bir takip mesajı ver."
        }
      },
      {
        "id": "social-variants",
        "tags": [
          "social"
        ],
        "en": {
          "title": "Social post in 5 variants",
          "body": "Turn this message into 5 social posts for {{platform|LinkedIn}}: {{message}}\n\nVariants: story, contrarian take, how-to list, question to the audience, short punchy line. Each under {{chars|600}} characters, with a hook in the first line and no more than 2 hashtags. Avoid clickbait claims."
        },
        "tr": {
          "title": "5 farklı sosyal medya gönderisi",
          "body": "Bu mesajı {{platform|LinkedIn}} için 5 gönderiye dönüştür: {{mesaj}}\n\nVaryantlar: hikaye, aykırı görüş, nasıl yapılır listesi, takipçilere soru, kısa ve vurucu cümle. Her biri {{karakter|600}} karakterden kısa, ilk satırda dikkat çekici giriş ve en fazla 2 hashtag. Tık tuzağı iddialardan kaçın."
        }
      },
      {
        "id": "ad-copy",
        "tags": [
          "ads"
        ],
        "en": {
          "title": "Ad copy with compliance check",
          "body": "Write {{count|6}} ad variations for {{product}} on {{channel|Google Search}} targeting {{audience}}.\n\nFor each: headline(s) within the channel's character limits, description, and the angle used (pain, gain, proof, curiosity). Then run a compliance check: flag any claim that needs proof, any superlative (\"best\", \"#1\") and anything a platform policy could reject."
        },
        "tr": {
          "title": "Uyum kontrollü reklam metni",
          "body": "{{hedef kitle}} hedefli, {{kanal|Google Arama}} için {{ürün}} adına {{adet|6}} reklam varyasyonu yaz.\n\nHer biri için: kanalın karakter sınırları içinde başlık(lar), açıklama ve kullanılan açı (acı, kazanç, kanıt, merak). Ardından uyum kontrolü yap: kanıt gerektiren her iddiayı, her üstünlük ifadesini (\"en iyi\", \"1 numara\") ve platform politikasının reddedebileceği her şeyi işaretle."
        }
      },
      {
        "id": "positioning",
        "tags": [
          "positioning",
          "competitors"
        ],
        "en": {
          "title": "Competitor positioning map",
          "body": "Compare {{product}} with these competitors: {{competitors}}.\n\nBuild a table: target customer, main promise, pricing model, strengths, weaknesses (from public reviews if provided: {{reviews|none}}). Then propose 2 positioning angles where we can credibly be different, and what we would need to prove each one."
        },
        "tr": {
          "title": "Rakip konumlandırma haritası",
          "body": "{{ürün}} ile şu rakipleri karşılaştır: {{rakipler}}.\n\nBir tablo oluştur: hedef müşteri, ana vaat, fiyat modeli, güçlü yanlar, zayıf yanlar (verildiyse kamuya açık yorumlardan: {{yorumlar|yok}}). Ardından inandırıcı biçimde farklı olabileceğimiz 2 konumlandırma açısı ve her birini kanıtlamak için neye ihtiyaç olduğunu öner."
        }
      },
      {
        "id": "seo-clusters",
        "tags": [
          "seo",
          "content"
        ],
        "en": {
          "title": "SEO keyword clusters and content plan",
          "body": "Topic: {{topic}}. Audience: {{audience}}. Language/market: {{market|English, global}}.\n\nGroup likely search queries into clusters by intent (informational, comparison, transactional). For each cluster suggest one pillar page and 3 supporting articles with working titles. Note: you cannot see real search volumes, so label volume as unknown and suggest how to verify it."
        },
        "tr": {
          "title": "SEO anahtar kelime kümeleri ve içerik planı",
          "body": "Konu: {{konu}}. Kitle: {{kitle}}. Dil/pazar: {{pazar|Türkçe, Türkiye}}.\n\nOlası arama sorgularını niyete göre kümele (bilgi, karşılaştırma, satın alma). Her küme için bir ana sayfa ve çalışma başlıklarıyla 3 destek yazısı öner. Not: gerçek arama hacimlerini göremezsin; hacmi bilinmiyor olarak etiketle ve nasıl doğrulanacağını öner."
        }
      },
      {
        "id": "launch-plan",
        "tags": [
          "launch"
        ],
        "en": {
          "title": "Product launch plan",
          "body": "Create a {{weeks|4}}-week launch plan for {{product}} with a budget of {{budget|almost zero}} and {{hours|5}} hours per week.\n\nWeek by week: goals, channels, content to prepare, people/communities to contact, and one metric to watch. Include a pre-launch checklist and what to do if week 2 shows no traction."
        },
        "tr": {
          "title": "Ürün lansman planı",
          "body": "{{ürün}} için {{bütçe|neredeyse sıfır}} bütçe ve haftada {{saat|5}} saatle {{hafta|4}} haftalık bir lansman planı oluştur.\n\nHafta hafta: hedefler, kanallar, hazırlanacak içerik, iletişime geçilecek kişi/topluluklar ve izlenecek tek bir metrik. Lansman öncesi kontrol listesi ve 2. haftada ilgi yoksa ne yapılacağını ekle."
        }
      },
      {
        "id": "interview-script",
        "tags": [
          "research"
        ],
        "en": {
          "title": "Customer interview script",
          "body": "Write a 20-minute customer discovery interview script for {{target}} about {{problem}}.\n\nUse open, past-behaviour questions (\"Tell me about the last time…\"), avoid leading or hypothetical questions, and include follow-up probes. Add an intro that asks for consent to take notes, and a closing question asking for referrals."
        },
        "tr": {
          "title": "Müşteri görüşmesi senaryosu",
          "body": "{{hedef}} ile {{sorun}} hakkında 20 dakikalık bir müşteri keşif görüşmesi senaryosu yaz.\n\nAçık uçlu, geçmiş davranışa dayalı sorular kullan (\"En son ne zaman… anlatır mısınız?\"), yönlendirici veya varsayımsal sorulardan kaçın, derinleştirme soruları ekle. Not almak için izin isteyen bir giriş ve tavsiye isteyen bir kapanış sorusu ekle."
        }
      },
      {
        "id": "ab-test",
        "tags": [
          "experiments"
        ],
        "en": {
          "title": "A/B test hypothesis",
          "body": "Help me design an A/B test for {{page_or_flow}}.\n\nCurrent metric: {{metric|signup conversion}}. Idea: {{idea}}.\nWrite the hypothesis (because… we believe… will…), the primary and guardrail metrics, how to split traffic, the minimum detectable effect worth caring about, and when to stop. Warn me if the traffic is likely too low for a reliable result."
        },
        "tr": {
          "title": "A/B testi hipotezi",
          "body": "{{sayfa veya akış}} için bir A/B testi tasarlamama yardım et.\n\nMevcut metrik: {{metrik|kayıt dönüşümü}}. Fikir: {{fikir}}.\nHipotezi (çünkü… inanıyoruz ki… şunu sağlayacak…), birincil ve koruyucu metrikleri, trafiğin nasıl bölüneceğini, önemsenecek en küçük etkiyi ve ne zaman durdurulacağını yaz. Güvenilir sonuç için trafik muhtemelen azsa beni uyar."
        }
      },
      {
        "id": "newsletter",
        "tags": [
          "email",
          "content"
        ],
        "en": {
          "title": "Newsletter issue",
          "body": "Write newsletter issue #{{issue|1}} for {{audience}} about {{topic}}.\n\nStructure: one-line intro, main story (what happened, why it matters, what to do), 3 short links/notes with a sentence each ({{links|leave placeholders}}), and a reply prompt. Length about {{words|400}} words. Voice: {{voice|friendly expert}}."
        },
        "tr": {
          "title": "Bülten sayısı",
          "body": "{{kitle}} için {{konu}} hakkında {{sayı|1}} numaralı bülteni yaz.\n\nYapı: tek satırlık giriş, ana hikaye (ne oldu, neden önemli, ne yapmalı), birer cümleyle 3 kısa bağlantı/not ({{bağlantılar|yer tutucu bırak}}) ve yanıt vermeye davet. Uzunluk yaklaşık {{kelime|400}} kelime. Ses: {{ses|samimi uzman}}."
        }
      },
      {
        "id": "testimonial-request",
        "tags": [
          "email",
          "proof"
        ],
        "en": {
          "title": "Ask a real customer for a testimonial",
          "body": "Write a short message asking {{customer_name}}, who used {{product}} for {{use_case}}, for an honest testimonial.\n\nMake it easy: 3 optional guiding questions, permission to use their name or stay anonymous, and a clear note that a critical answer is welcome too. No incentives that would bias the review."
        },
        "tr": {
          "title": "Gerçek bir müşteriden yorum iste",
          "body": "{{ürün}} ürününü {{kullanım}} için kullanan {{müşteri adı}} kişisinden dürüst bir yorum isteyen kısa bir mesaj yaz.\n\nKolaylaştır: 3 isteğe bağlı yönlendirici soru, adının kullanılması veya anonim kalma izni ve eleştirel bir yanıtın da memnuniyetle karşılanacağına dair açık bir not. Yorumu etkileyecek teşvik yok."
        }
      },
      {
        "id": "pricing-faq",
        "tags": [
          "pricing"
        ],
        "en": {
          "title": "Pricing page FAQ",
          "body": "Write a pricing-page FAQ for {{product}} with these plans: {{plans}}.\n\nCover: what is included, limits, billing cycle, refunds/cancellation ({{refund_policy|leave placeholder}}), data ownership, upgrades/downgrades, taxes/currency and support. Answers under 60 words, plain language, no hidden conditions."
        },
        "tr": {
          "title": "Fiyat sayfası SSS",
          "body": "Şu planlara sahip {{ürün}} için bir fiyat sayfası SSS'i yaz: {{planlar}}.\n\nKapsa: neler dahil, sınırlar, fatura dönemi, iade/iptal ({{iade politikası|yer tutucu bırak}}), veri sahipliği, plan yükseltme/düşürme, vergi/para birimi ve destek. Yanıtlar 60 kelimeden kısa, sade dil, gizli koşul yok."
        }
      }
    ]
  };
  if (typeof module === 'object' && module.exports) module.exports = pack;
  else { root.PM = root.PM || {}; (root.PM.PACK_DATA = root.PM.PACK_DATA || []).push(pack); }
})(typeof self !== 'undefined' ? self : this);
