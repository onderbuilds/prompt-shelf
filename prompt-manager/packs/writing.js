(function (root) {
  const pack = {
    "id": "writing",
    "version": 1,
    "name": {
      "en": "Content writing",
      "tr": "İçerik yazımı"
    },
    "description": {
      "en": "Outlines, drafts, edits and repurposing for blogs, video and social.",
      "tr": "Blog, video ve sosyal medya için taslak, yazım, düzenleme ve yeniden kullanım."
    },
    "templates": [
      {
        "id": "outline",
        "tags": [
          "blog",
          "structure"
        ],
        "en": {
          "title": "Article outline",
          "body": "Create an outline for an article about {{topic}} for {{audience|beginners}}.\nGoal of the reader: {{reader_goal|understand the basics and take a first step}}.\n\nGive a working title, a one-sentence promise, H2/H3 headings with 1-2 bullet notes each, where examples or data are needed ([SOURCE NEEDED]), and a conclusion with one action."
        },
        "tr": {
          "title": "Makale taslağı",
          "body": "{{kitle|yeni başlayanlar}} için {{konu}} hakkında bir makale taslağı oluştur.\nOkurun amacı: {{okur amacı|temelleri anlamak ve ilk adımı atmak}}.\n\nÇalışma başlığı, tek cümlelik vaat, her biri 1-2 madde notlu H2/H3 başlıklar, örnek veya veri gereken yerler ([KAYNAK GEREKLİ]) ve tek bir eylem içeren sonuç ver."
        }
      },
      {
        "id": "draft",
        "tags": [
          "blog",
          "drafting"
        ],
        "en": {
          "title": "Draft an article from an outline",
          "body": "Write the full article from this outline:\n{{outline}}\n\nLength: about {{words|1200}} words. Voice: {{voice|clear, practical, friendly}}. Use short paragraphs, concrete examples, and subheadings from the outline. Do not invent statistics or quotes; insert [SOURCE NEEDED] where a fact must be checked."
        },
        "tr": {
          "title": "Taslaktan makale yaz",
          "body": "Bu taslaktan makalenin tamamını yaz:\n{{taslak}}\n\nUzunluk: yaklaşık {{kelime|1200}} kelime. Ses: {{ses|açık, pratik, samimi}}. Kısa paragraflar, somut örnekler ve taslaktaki alt başlıkları kullan. İstatistik veya alıntı uydurma; doğrulanması gereken yerlere [KAYNAK GEREKLİ] ekle."
        }
      },
      {
        "id": "clarity",
        "tags": [
          "editing"
        ],
        "en": {
          "title": "Rewrite for clarity",
          "body": "Rewrite this text so a {{reader|busy reader}} understands it on the first read:\n{{text}}\n\nKeep the meaning and all facts. Shorter sentences, active voice, no jargon unless explained. Then list the 3 most important changes you made and why."
        },
        "tr": {
          "title": "Anlaşılır olacak şekilde yeniden yaz",
          "body": "Bu metni bir {{okur|yoğun okurun}} ilk okumada anlayacağı şekilde yeniden yaz:\n{{metin}}\n\nAnlamı ve tüm gerçekleri koru. Daha kısa cümleler, etken çatı, açıklanmadıkça jargon yok. Ardından yaptığın en önemli 3 değişikliği ve nedenini listele."
        }
      },
      {
        "id": "headlines",
        "tags": [
          "headlines"
        ],
        "en": {
          "title": "Headline variants",
          "body": "Write {{count|10}} headline options for this piece:\n{{summary}}\n\nMix types: benefit, how-to, number list, question, curiosity (without clickbait), and a plain descriptive one. Keep each under {{chars|70}} characters and mark the 2 you would test first, with a reason."
        },
        "tr": {
          "title": "Başlık seçenekleri",
          "body": "Bu içerik için {{adet|10}} başlık seçeneği yaz:\n{{özet}}\n\nTürleri karıştır: fayda, nasıl yapılır, sayılı liste, soru, merak (tık tuzağı olmadan) ve sade açıklayıcı bir başlık. Her biri {{karakter|70}} karakterden kısa olsun ve önce test edeceğin 2 tanesini gerekçesiyle işaretle."
        }
      },
      {
        "id": "summary",
        "tags": [
          "summarize"
        ],
        "en": {
          "title": "Summarize for a specific reader",
          "body": "Summarize the text below for {{reader|a manager with 2 minutes}}.\n\nFormat: a one-line TL;DR, then {{bullets|5}} bullets with the key points, then \"What this means for you\" in 2 sentences. Keep numbers exact and say if the text leaves something important unclear.\n\n{{text}}"
        },
        "tr": {
          "title": "Belirli bir okur için özetle",
          "body": "Aşağıdaki metni {{okur|2 dakikası olan bir yönetici}} için özetle.\n\nBiçim: tek satırlık özet, ardından ana noktaları içeren {{madde|5}} madde, sonra 2 cümleyle \"Bu sizin için ne anlama geliyor\". Rakamları aynen koru ve metin önemli bir şeyi belirsiz bırakıyorsa belirt.\n\n{{metin}}"
        }
      },
      {
        "id": "tone",
        "tags": [
          "editing",
          "tone"
        ],
        "en": {
          "title": "Change the tone",
          "body": "Rewrite this text in a {{tone|warm but professional}} tone for {{channel|email}}:\n{{text}}\n\nKeep the same information and length (±15%). Show the rewrite, then 3 phrases from the original that changed the tone the most and what you replaced them with."
        },
        "tr": {
          "title": "Tonu değiştir",
          "body": "Bu metni {{kanal|e-posta}} için {{ton|sıcak ama profesyonel}} bir tonda yeniden yaz:\n{{metin}}\n\nAynı bilgiyi ve uzunluğu (±%15) koru. Yeniden yazılmış hali göster, ardından tonu en çok değiştiren orijinal 3 ifadeyi ve yerine ne koyduğunu yaz."
        }
      },
      {
        "id": "video-script",
        "tags": [
          "video",
          "youtube"
        ],
        "en": {
          "title": "Video script",
          "body": "Write a {{minutes|6}}-minute video script about {{topic}} for {{platform|YouTube}}.\n\nInclude: a hook in the first 10 seconds, the promise of the video, 3-5 sections with on-screen notes [B-ROLL]/[TEXT], a mid-video recap, and a closing call to action. Write for speaking: short sentences, natural transitions. Add timestamps."
        },
        "tr": {
          "title": "Video senaryosu",
          "body": "{{platform|YouTube}} için {{konu}} hakkında {{dakika|6}} dakikalık bir video senaryosu yaz.\n\nŞunları ekle: ilk 10 saniyede dikkat çekici giriş, videonun vaadi, ekran notlarıyla [B-ROLL]/[YAZI] 3-5 bölüm, video ortasında kısa özet ve kapanışta harekete geçirici mesaj. Konuşma diliyle yaz: kısa cümleler, doğal geçişler. Zaman damgaları ekle."
        }
      },
      {
        "id": "thread",
        "tags": [
          "social",
          "x"
        ],
        "en": {
          "title": "X / Twitter thread",
          "body": "Turn this idea into an X thread of {{posts|7}} posts: {{idea}}\n\nPost 1 is a strong hook with a clear promise. Each post makes one point, max 270 characters, numbered. Use concrete examples, no hashtags except possibly one at the end, and finish with a summary post and a soft call to action ({{cta|follow for more}})."
        },
        "tr": {
          "title": "X / Twitter zinciri",
          "body": "Bu fikri {{gönderi|7}} gönderilik bir X zincirine dönüştür: {{fikir}}\n\nİlk gönderi net bir vaat içeren güçlü bir giriş olsun. Her gönderi tek bir noktaya değinsin, en fazla 270 karakter, numaralı. Somut örnekler kullan, en fazla sonda tek bir hashtag, ve bir özet gönderisi ile yumuşak bir harekete geçirici mesajla bitir ({{çağrı|daha fazlası için takip et}})."
        }
      },
      {
        "id": "case-study",
        "tags": [
          "proof",
          "b2b"
        ],
        "en": {
          "title": "Customer case study",
          "body": "Write a case study from these interview notes:\n{{notes}}\n\nStructure: headline with the outcome, customer background, the problem (in their words), why they chose {{product}}, implementation, results (only numbers present in the notes), and a quote marked [CONFIRM WITH CUSTOMER]. Length about {{words|700}} words."
        },
        "tr": {
          "title": "Müşteri başarı hikayesi",
          "body": "Bu görüşme notlarından bir başarı hikayesi yaz:\n{{notlar}}\n\nYapı: sonucu içeren başlık, müşteri geçmişi, sorun (kendi sözleriyle), neden {{ürün}} seçtikleri, uygulama, sonuçlar (yalnızca notlarda bulunan rakamlar) ve [MÜŞTERİYLE TEYİT ET] olarak işaretlenmiş bir alıntı. Uzunluk yaklaşık {{kelime|700}} kelime."
        }
      },
      {
        "id": "product-description",
        "tags": [
          "ecommerce"
        ],
        "en": {
          "title": "Product description",
          "body": "Write a product description for {{product}}.\nFacts: {{facts}}\nBuyer: {{buyer|someone buying it as a gift}}\n\nGive: a 1-line hook, a short paragraph on the experience of using it, a bullet list of specs/materials taken only from the facts, care/usage notes, and 10 search-friendly tags. No exaggerated or unverifiable claims."
        },
        "tr": {
          "title": "Ürün açıklaması",
          "body": "{{ürün}} için bir ürün açıklaması yaz.\nGerçekler: {{gerçekler}}\nAlıcı: {{alıcı|hediye olarak alan biri}}\n\nVer: tek satırlık dikkat çekici giriş, ürünü kullanma deneyimini anlatan kısa bir paragraf, yalnızca gerçeklerden alınmış özellik/malzeme listesi, bakım/kullanım notları ve aramaya uygun 10 etiket. Abartılı veya doğrulanamaz iddia yok."
        }
      },
      {
        "id": "press-release",
        "tags": [
          "pr"
        ],
        "en": {
          "title": "Press release",
          "body": "Write a press release announcing {{news}} by {{organisation}}.\n\nFormat: headline, subheadline, dateline ({{city|Istanbul}}, [DATE]), lead paragraph answering who/what/when/where/why, 2-3 body paragraphs, one quote from {{spokesperson|[NAME, TITLE]}} marked for approval, boilerplate \"About\" section and media contact placeholder. Neutral, factual tone."
        },
        "tr": {
          "title": "Basın bülteni",
          "body": "{{kurum}} tarafından {{haber}} duyurusu yapan bir basın bülteni yaz.\n\nBiçim: başlık, alt başlık, yer ve tarih ({{şehir|İstanbul}}, [TARİH]), kim/ne/ne zaman/nerede/neden sorularını yanıtlayan giriş paragrafı, 2-3 gövde paragrafı, onay için işaretlenmiş {{sözcü|[AD, UNVAN]}} alıntısı, standart \"Hakkında\" bölümü ve basın iletişimi yer tutucusu. Tarafsız, olgusal ton."
        }
      },
      {
        "id": "faq",
        "tags": [
          "support",
          "structure"
        ],
        "en": {
          "title": "FAQ from a document",
          "body": "Create an FAQ from this document for {{audience|customers}}:\n{{text}}\n\nWrite {{count|8}} questions people would actually ask (in their words), each with an answer under 60 words based only on the document. List any question the document cannot answer under \"Needs an answer\"."
        },
        "tr": {
          "title": "Belgeden SSS oluştur",
          "body": "Bu belgeden {{kitle|müşteriler}} için bir SSS oluştur:\n{{metin}}\n\nİnsanların gerçekten soracağı (kendi kelimeleriyle) {{adet|8}} soru yaz, her birine yalnızca belgeye dayanan 60 kelimeden kısa bir yanıt ver. Belgenin yanıtlayamadığı soruları \"Yanıt gerekiyor\" başlığı altında listele."
        }
      },
      {
        "id": "proofread",
        "tags": [
          "editing",
          "grammar"
        ],
        "en": {
          "title": "Proofread and explain edits",
          "body": "Proofread this {{language|English}} text. Fix grammar, spelling, punctuation and awkward phrasing, but keep my voice.\n\nReturn: the corrected text, then a table of changes (original → corrected → reason). Do not change technical terms or names.\n\n{{text}}"
        },
        "tr": {
          "title": "Düzelti yap ve değişiklikleri açıkla",
          "body": "Bu {{dil|Türkçe}} metnin düzeltisini yap. Dil bilgisi, yazım, noktalama ve kötü ifadeleri düzelt ama benim üslubumu koru.\n\nDöndür: düzeltilmiş metin, ardından değişiklik tablosu (orijinal → düzeltilmiş → neden). Teknik terimleri ve isimleri değiştirme.\n\n{{metin}}"
        }
      },
      {
        "id": "hooks",
        "tags": [
          "intro",
          "storytelling"
        ],
        "en": {
          "title": "Opening hooks",
          "body": "Write {{count|5}} different opening paragraphs for a piece about {{topic}} aimed at {{audience}}.\n\nStyles: a short scene/story, a surprising (true) fact [SOURCE NEEDED], a common mistake, a direct question, and a bold but defensible statement. Each under 60 words; say which fits best and why."
        },
        "tr": {
          "title": "Açılış girişleri",
          "body": "{{kitle}} hedefli, {{konu}} hakkındaki bir yazı için {{adet|5}} farklı açılış paragrafı yaz.\n\nTarzlar: kısa bir sahne/hikaye, şaşırtıcı (gerçek) bir bilgi [KAYNAK GEREKLİ], yaygın bir hata, doğrudan bir soru ve cesur ama savunulabilir bir iddia. Her biri 60 kelimeden kısa; hangisinin en uygun olduğunu ve nedenini söyle."
        }
      },
      {
        "id": "repurpose",
        "tags": [
          "repurpose",
          "social"
        ],
        "en": {
          "title": "Repurpose one piece into many",
          "body": "Repurpose this content into: a LinkedIn post, an X thread outline (5 posts), a 60-second video script, a newsletter blurb (80 words) and 3 quote cards.\n\nAdapt length and tone to each format; keep facts identical; target audience: {{audience|same as original}}.\n\n{{content}}"
        },
        "tr": {
          "title": "Tek içeriği çok formata dönüştür",
          "body": "Bu içeriği şunlara dönüştür: bir LinkedIn gönderisi, bir X zinciri taslağı (5 gönderi), 60 saniyelik video senaryosu, bir bülten kısa notu (80 kelime) ve 3 alıntı kartı.\n\nUzunluk ve tonu her formata uyarla; gerçekleri aynen koru; hedef kitle: {{kitle|orijinaliyle aynı}}.\n\n{{içerik}}"
        }
      }
    ]
  };
  if (typeof module === 'object' && module.exports) module.exports = pack;
  else { root.PM = root.PM || {}; (root.PM.PACK_DATA = root.PM.PACK_DATA || []).push(pack); }
})(typeof self !== 'undefined' ? self : this);
