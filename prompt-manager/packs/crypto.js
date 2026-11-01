(function (root) {
  const pack = {
    "id": "crypto",
    "version": 1,
    "name": {
      "en": "Crypto analysis",
      "tr": "Kripto analizi"
    },
    "description": {
      "en": "Research and risk-check frameworks. No signals, no price predictions, not financial advice.",
      "tr": "Araştırma ve risk kontrol çerçeveleri. Sinyal yok, fiyat tahmini yok, yatırım tavsiyesi değildir."
    },
    "templates": [
      {
        "id": "tokenomics",
        "tags": [
          "tokenomics",
          "research"
        ],
        "en": {
          "title": "Tokenomics review",
          "body": "Review the tokenomics of {{token|the project}} using this information:\n{{data}}\n\nAnalyse: total vs circulating supply, allocation (team, investors, treasury, community) in a table, vesting and unlock schedule, emission/inflation, sinks and real utility, who controls minting. For each point state what is verified (with source), what is claimed only, and what is missing. End with the 5 biggest structural risks.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Tokenomik incelemesi",
          "body": "{{token|projenin}} tokenomiğini şu bilgilerle incele:\n{{veri}}\n\nAnaliz et: toplam ve dolaşımdaki arz, dağılım (ekip, yatırımcı, hazine, topluluk) tablo halinde, vesting ve kilit açılma takvimi, emisyon/enflasyon, token yakma alanları ve gerçek kullanım, basım yetkisinin kimde olduğu. Her madde için neyin doğrulandığını (kaynakla), neyin yalnızca iddia olduğunu ve neyin eksik olduğunu belirt. En büyük 5 yapısal riskle bitir.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "rug-check",
        "tags": [
          "risk",
          "checklist"
        ],
        "en": {
          "title": "Rug-pull risk checklist",
          "body": "Walk through this rug-pull risk checklist for {{token}} on {{chain|Solana}} using the data I provide:\n{{data}}\n\nFor each item answer PASS / FAIL / UNKNOWN with the evidence:\n1. Mint authority revoked?\n2. Freeze authority revoked?\n3. Contract upgradeable / owner privileges?\n4. Liquidity locked or burned, for how long, by whom?\n5. Dev/team wallet share and recent movements\n6. Top-10 holder concentration (excluding pools/exchanges)\n7. Honeypot signs (can holders sell? unusual taxes?)\n8. Socials: age, real activity, community warnings\nThen summarise the red flags. UNKNOWN must never be treated as PASS.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Rug-pull risk kontrol listesi",
          "body": "{{zincir|Solana}} üzerindeki {{token}} için verdiğim verilerle bu rug-pull risk kontrol listesini adım adım uygula:\n{{veri}}\n\nHer madde için kanıtıyla birlikte GEÇTİ / KALDI / BİLİNMİYOR yaz:\n1. Mint yetkisi iptal edilmiş mi?\n2. Freeze yetkisi iptal edilmiş mi?\n3. Kontrat yükseltilebilir mi / sahip ayrıcalıkları?\n4. Likidite kilitli mi yakılmış mı, ne kadar süre, kim tarafından?\n5. Geliştirici/ekip cüzdan payı ve son hareketleri\n6. İlk 10 sahibin yoğunlaşması (havuz/borsa hariç)\n7. Honeypot işaretleri (satış yapılabiliyor mu? olağandışı vergi?)\n8. Sosyal hesaplar: yaş, gerçek etkinlik, topluluk uyarıları\nArdından kırmızı bayrakları özetle. BİLİNMİYOR asla GEÇTİ sayılmamalı.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "whitepaper",
        "tags": [
          "research",
          "documents"
        ],
        "en": {
          "title": "Whitepaper critique",
          "body": "Critique this whitepaper (or excerpt) like a sceptical technical reviewer:\n{{text}}\n\nCover: the problem and whether a token is actually needed, technical feasibility, claims that are vague or unfalsifiable, missing details (security model, governance, economics), copied or buzzword-heavy sections, and inconsistencies with the tokenomics. List 10 precise questions the team should answer publicly.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Whitepaper eleştirisi",
          "body": "Bu whitepaper'ı (veya bölümünü) şüpheci bir teknik inceleyici gibi eleştir:\n{{metin}}\n\nKapsa: sorun ve gerçekten bir tokena gerek olup olmadığı, teknik uygulanabilirlik, belirsiz veya yanlışlanamaz iddialar, eksik ayrıntılar (güvenlik modeli, yönetişim, ekonomi), kopya ya da moda kelimelerle dolu bölümler ve tokenomikle tutarsızlıklar. Ekibin kamuya açık yanıtlaması gereken 10 net soru listele.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "onchain-read",
        "tags": [
          "on-chain",
          "data"
        ],
        "en": {
          "title": "Interpret on-chain data",
          "body": "Help me interpret this on-chain data for {{asset}}:\n{{data}}\n\nExplain what each metric measures and its common pitfalls (exchange wallets, bridges, contract accounts, wash activity). Describe what the data is consistent with, what alternative explanations exist, and what additional data would distinguish between them. Do not turn this into a trading call.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Zincir üstü veriyi yorumla",
          "body": "{{varlık}} için şu zincir üstü veriyi yorumlamama yardım et:\n{{veri}}\n\nHer metriğin neyi ölçtüğünü ve yaygın tuzaklarını (borsa cüzdanları, köprüler, kontrat hesapları, sahte hacim) açıkla. Verinin neyle tutarlı olduğunu, hangi alternatif açıklamaların bulunduğunu ve bunları ayırt etmek için hangi ek verinin gerektiğini anlat. Bunu bir alım-satım çağrısına dönüştürme.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "contract-permissions",
        "tags": [
          "security",
          "smart-contracts"
        ],
        "en": {
          "title": "Smart contract permission review",
          "body": "Review the privileged functions in this contract (or verified source / explorer read-out):\n{{code}}\n\nList every role/owner-only function and what it can do (mint, pause, blacklist, change fees, upgrade, withdraw). For each: who holds the role ({{owner_info|unknown}}), whether a timelock or multisig applies, and the worst-case abuse. Explain in plain language for a non-developer.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Akıllı kontrat yetki incelemesi",
          "body": "Bu kontrattaki (veya doğrulanmış kaynak / explorer çıktısındaki) ayrıcalıklı fonksiyonları incele:\n{{kod}}\n\nYalnızca sahip/rol tarafından çağrılabilen her fonksiyonu ve ne yapabildiğini listele (basım, durdurma, kara liste, ücret değiştirme, yükseltme, çekim). Her biri için: rolün kimde olduğu ({{sahip bilgisi|bilinmiyor}}), zaman kilidi veya çoklu imza olup olmadığı ve en kötü kötüye kullanım senaryosu. Geliştirici olmayan biri için sade dille açıkla.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "team-dd",
        "tags": [
          "due-diligence"
        ],
        "en": {
          "title": "Team and governance due diligence",
          "body": "Do a due-diligence review of the team and governance behind {{project}} using:\n{{info}}\n\nCheck: are founders public and verifiable, track record (previous projects and how they ended), advisor claims, who controls the treasury and admin keys, how governance votes work in practice (turnout, whale control), and legal entity/jurisdiction. Separate verified facts from claims.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Ekip ve yönetişim inceleme",
          "body": "{{proje}} arkasındaki ekip ve yönetişimi şu bilgilerle incele:\n{{bilgi}}\n\nKontrol et: kurucular kamuya açık ve doğrulanabilir mi, geçmiş (önceki projeler ve nasıl sonuçlandıkları), danışman iddiaları, hazineyi ve yönetici anahtarlarını kimin kontrol ettiği, yönetişim oylamalarının pratikte nasıl işlediği (katılım, balina kontrolü) ve tüzel kişilik/yetki alanı. Doğrulanmış gerçekleri iddialardan ayır.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "liquidity",
        "tags": [
          "liquidity",
          "risk"
        ],
        "en": {
          "title": "Liquidity structure analysis",
          "body": "Analyse the liquidity of {{token}} with this data:\n{{data}}\n\nExplain: where liquidity sits (DEX pools, CEX), pool size relative to market cap, LP token ownership and lock status, how much a sell of {{size|1% of supply}} would move the price (explain the formula, do not predict), and concentration risks if one LP withdraws.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Likidite yapısı analizi",
          "body": "{{token}} likiditesini şu verilerle analiz et:\n{{veri}}\n\nAçıkla: likiditenin nerede olduğu (DEX havuzları, merkezi borsalar), havuz büyüklüğünün piyasa değerine oranı, LP token sahipliği ve kilit durumu, {{miktar|arzın %1'i}} büyüklüğünde bir satışın fiyatı ne kadar etkileyeceği (formülü açıkla, tahmin yapma) ve tek bir LP çekilirse oluşacak yoğunlaşma riskleri.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "holders",
        "tags": [
          "on-chain",
          "distribution"
        ],
        "en": {
          "title": "Holder distribution analysis",
          "body": "Analyse this holder list for {{token}}:\n{{holders}}\n\nLabel likely categories (pools, exchanges, team/vesting contracts, bridges, individuals). Compute concentration of the top 10 and top 50 excluding pools/exchanges, flag clusters of wallets that look linked (same funding source, same buy time), and explain what cannot be concluded from this data alone.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Sahip dağılımı analizi",
          "body": "{{token}} için bu sahip listesini analiz et:\n{{sahipler}}\n\nOlası kategorileri etiketle (havuzlar, borsalar, ekip/vesting kontratları, köprüler, bireyler). Havuz/borsa hariç ilk 10 ve ilk 50 yoğunlaşmasını hesapla, bağlantılı görünen cüzdan kümelerini (aynı fon kaynağı, aynı alım zamanı) işaretle ve yalnızca bu veriden hangi sonuçların çıkarılamayacağını açıkla.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "unlocks",
        "tags": [
          "tokenomics",
          "vesting"
        ],
        "en": {
          "title": "Vesting and unlock schedule review",
          "body": "Build a timeline of upcoming token unlocks for {{token}} from:\n{{schedule}}\n\nShow a table (date, recipient group, amount, % of circulating supply at that time). Highlight cliffs, months where supply grows more than {{threshold|5%}}, and unclear or unverifiable entries. Explain why unlocks matter for holders without predicting price moves.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Vesting ve kilit açılma takvimi incelemesi",
          "body": "{{token}} için yaklaşan kilit açılmalarının zaman çizelgesini şundan oluştur:\n{{takvim}}\n\nBir tablo göster (tarih, alıcı grubu, miktar, o andaki dolaşım arzının yüzdesi). Cliff'leri, arzın {{eşik|%5}}'ten fazla arttığı ayları ve belirsiz ya da doğrulanamayan kayıtları vurgula. Kilit açılmalarının sahipler için neden önemli olduğunu fiyat hareketi tahmin etmeden açıkla.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "claims-check",
        "tags": [
          "research",
          "verification"
        ],
        "en": {
          "title": "Narrative vs. evidence check",
          "body": "Here are claims made about {{project}} (announcements, posts, KOL threads):\n{{claims}}\n\nFor each claim: classify it (partnership, metric, technology, listing, team), state what evidence would verify it, whether such evidence was provided, and red-flag wording (\"guaranteed\", \"next 100x\", unnamed partners). Output a table and a short summary of what is actually proven.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Anlatı ve kanıt kontrolü",
          "body": "{{proje}} hakkında yapılan iddialar (duyurular, gönderiler, KOL zincirleri):\n{{iddialar}}\n\nHer iddia için: sınıflandır (ortaklık, metrik, teknoloji, listeleme, ekip), onu neyin doğrulayacağını, böyle bir kanıtın sunulup sunulmadığını ve kırmızı bayrak ifadeleri (\"garantili\", \"sıradaki 100x\", isimsiz ortaklar) belirt. Bir tablo ve gerçekten neyin kanıtlandığına dair kısa bir özet çıkar.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "scam-message",
        "tags": [
          "security",
          "phishing"
        ],
        "en": {
          "title": "Scam / phishing message check",
          "body": "I received this message/link related to crypto:\n{{message}}\n\nCheck it for common scam patterns: impersonation, fake support, urgency, requests for seed phrase or private key, wallet-drainer approval requests, fake airdrops, look-alike domains. Explain each warning sign you find and what a safe next step is. Remind me never to share a seed phrase or sign unknown approvals."
        },
        "tr": {
          "title": "Dolandırıcılık / oltalama mesajı kontrolü",
          "body": "Kriptoyla ilgili şu mesajı/bağlantıyı aldım:\n{{mesaj}}\n\nYaygın dolandırıcılık kalıplarına göre kontrol et: kimliğe bürünme, sahte destek, aciliyet, seed phrase veya özel anahtar talebi, cüzdan boşaltan onay istekleri, sahte airdrop'lar, benzer görünen alan adları. Bulduğun her uyarı işaretini ve güvenli bir sonraki adımı açıkla. Seed phrase'i asla paylaşmamam ve bilinmeyen onayları imzalamamam gerektiğini hatırlat."
        }
      },
      {
        "id": "audit-reader",
        "tags": [
          "security",
          "audits"
        ],
        "en": {
          "title": "Read a smart contract audit report",
          "body": "Summarise this audit report for a non-expert:\n{{report}}\n\nInclude: auditor, scope (which contracts and commit), date, findings by severity, which were fixed vs acknowledged vs open, and limitations stated by the auditor. Point out if the deployed contract may differ from the audited code and how to check it ({{address|contract address unknown}}).\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Akıllı kontrat denetim raporunu oku",
          "body": "Bu denetim raporunu uzman olmayan biri için özetle:\n{{rapor}}\n\nŞunları ekle: denetçi, kapsam (hangi kontratlar ve commit), tarih, önem derecesine göre bulgular, hangilerinin düzeltildiği / kabul edildiği / açık kaldığı ve denetçinin belirttiği sınırlamalar. Yayındaki kontratın denetlenen koddan farklı olabileceğini ve bunun nasıl kontrol edileceğini belirt ({{adres|kontrat adresi bilinmiyor}}).\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "risk-register",
        "tags": [
          "risk"
        ],
        "en": {
          "title": "Project risk register",
          "body": "Create a risk register for {{project}} based on:\n{{notes}}\n\nCategories: smart contract, custody/keys, liquidity, regulatory, team/governance, market structure, operational. For each risk: description, likelihood (low/med/high) with reasoning, impact, early-warning signals to monitor, and what information would reduce uncertainty.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Proje risk kaydı",
          "body": "{{proje}} için şu notlara dayanarak bir risk kaydı oluştur:\n{{notlar}}\n\nKategoriler: akıllı kontrat, saklama/anahtarlar, likidite, düzenleyici, ekip/yönetişim, piyasa yapısı, operasyonel. Her risk için: açıklama, gerekçesiyle olasılık (düşük/orta/yüksek), etki, izlenecek erken uyarı sinyalleri ve belirsizliği azaltacak bilgiler.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "defi-risk",
        "tags": [
          "defi",
          "risk"
        ],
        "en": {
          "title": "DeFi protocol risk review",
          "body": "Review the risks of using the DeFi protocol {{protocol}} for {{use|lending}} based on:\n{{info}}\n\nCover: oracle design and manipulation risk, admin keys/upgradeability, collateral and liquidation mechanics, dependency on other protocols, TVL concentration, past incidents and how they were handled, and the exit path if something breaks. Rate each area and explain what is unknown.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "DeFi protokol risk incelemesi",
          "body": "{{kullanım|borç verme}} için {{protokol}} DeFi protokolünü kullanmanın risklerini şu bilgilere göre incele:\n{{bilgi}}\n\nKapsa: oracle tasarımı ve manipülasyon riski, yönetici anahtarları/yükseltilebilirlik, teminat ve tasfiye mekanikleri, diğer protokollere bağımlılık, TVL yoğunlaşması, geçmiş olaylar ve nasıl yönetildikleri, bir şey bozulursa çıkış yolu. Her alanı puanla ve neyin bilinmediğini açıkla.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      },
      {
        "id": "research-log",
        "tags": [
          "research",
          "process"
        ],
        "en": {
          "title": "Research log and open questions",
          "body": "Turn my notes on {{project}} into a structured research log:\n{{notes}}\n\nSections: what the project claims, what I verified (with sources), contradictions, open questions ranked by importance, and the evidence that would change my view in either direction. Keep it neutral; the goal is understanding, not a decision to trade.\n\nImportant: this is a research and risk-awareness framework, not financial advice. Do not give buy/sell/hold recommendations, price predictions or price targets; describe evidence, unknowns and risks only."
        },
        "tr": {
          "title": "Araştırma günlüğü ve açık sorular",
          "body": "{{proje}} hakkındaki notlarımı yapılandırılmış bir araştırma günlüğüne dönüştür:\n{{notlar}}\n\nBölümler: projenin iddiaları, doğruladıklarım (kaynaklarıyla), çelişkiler, önem sırasına göre açık sorular ve görüşümü her iki yönde değiştirecek kanıtlar. Tarafsız kal; amaç anlamak, işlem kararı vermek değil.\n\nÖnemli: bu bir araştırma ve risk farkındalığı çerçevesidir, yatırım tavsiyesi değildir. Al/sat/tut önerisi, fiyat tahmini veya hedef fiyat verme; yalnızca kanıtları, bilinmeyenleri ve riskleri anlat."
        }
      }
    ]
  };
  if (typeof module === 'object' && module.exports) module.exports = pack;
  else { root.PM = root.PM || {}; (root.PM.PACK_DATA = root.PM.PACK_DATA || []).push(pack); }
})(typeof self !== 'undefined' ? self : this);
