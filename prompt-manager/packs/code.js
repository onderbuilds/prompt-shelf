(function (root) {
  const pack = {
    "id": "code",
    "version": 1,
    "name": {
      "en": "Code",
      "tr": "Kod"
    },
    "description": {
      "en": "Reviews, debugging, tests, refactors and docs for everyday programming.",
      "tr": "Günlük programlama için inceleme, hata ayıklama, test, refactor ve dokümantasyon."
    },
    "templates": [
      {
        "id": "review",
        "tags": [
          "review",
          "quality"
        ],
        "en": {
          "title": "Code review (bugs, security, readability)",
          "body": "Act as a senior {{language|TypeScript}} reviewer. Review the code below.\n\nReport, in this order:\n1. Bugs and incorrect behaviour (with the line or snippet)\n2. Security issues (injection, secrets, unsafe input handling)\n3. Readability and naming\n4. Missing tests\n\nFor each finding give severity (high/medium/low), why it matters, and a minimal fix. Do not rewrite the whole file. If something is fine, say so briefly.\n\n```\n{{code}}\n```"
        },
        "tr": {
          "title": "Kod incelemesi (hata, güvenlik, okunabilirlik)",
          "body": "Kıdemli bir {{dil|TypeScript}} inceleyicisi gibi davran. Aşağıdaki kodu incele.\n\nŞu sırayla raporla:\n1. Hatalar ve yanlış davranış (satır veya parça ile)\n2. Güvenlik sorunları (enjeksiyon, gizli anahtar, güvensiz girdi)\n3. Okunabilirlik ve isimlendirme\n4. Eksik testler\n\nHer bulgu için önem derecesi (yüksek/orta/düşük), neden önemli olduğu ve en küçük düzeltmeyi yaz. Dosyanın tamamını yeniden yazma. Sorun yoksa kısaca belirt.\n\n```\n{{kod}}\n```"
        }
      },
      {
        "id": "explain",
        "tags": [
          "learning"
        ],
        "en": {
          "title": "Explain this code step by step",
          "body": "Explain what this code does to a {{audience|junior developer}}.\n\n- Start with a 2-sentence summary.\n- Walk through it step by step, referencing function and variable names.\n- Point out any non-obvious tricks, side effects or edge cases.\n- End with one question I could ask to check my understanding.\n\n```\n{{code}}\n```"
        },
        "tr": {
          "title": "Bu kodu adım adım açıkla",
          "body": "Bu kodun ne yaptığını bir {{hedef kitle|yeni başlayan geliştiriciye}} açıkla.\n\n- 2 cümlelik bir özetle başla.\n- Fonksiyon ve değişken adlarına değinerek adım adım ilerle.\n- Açık olmayan hileleri, yan etkileri ve uç durumları belirt.\n- Anladığımı kontrol etmem için bir soruyla bitir.\n\n```\n{{kod}}\n```"
        }
      },
      {
        "id": "tests",
        "tags": [
          "testing"
        ],
        "en": {
          "title": "Write unit tests",
          "body": "Write unit tests for the code below using {{framework|Jest}}.\n\nCover: the happy path, boundary values, invalid input, and at least one failure/exception path. Use descriptive test names (\"returns X when Y\"). Mock only external I/O. After the tests, list any behaviour you could not test and why.\n\n```\n{{code}}\n```"
        },
        "tr": {
          "title": "Birim testleri yaz",
          "body": "Aşağıdaki kod için {{çatı|Jest}} ile birim testleri yaz.\n\nKapsa: normal akış, sınır değerler, geçersiz girdi ve en az bir hata/istisna yolu. Açıklayıcı test adları kullan (\"Y olduğunda X döner\"). Yalnızca dış G/Ç'yi taklit et (mock). Testlerden sonra test edemediğin davranışları ve nedenini listele.\n\n```\n{{kod}}\n```"
        }
      },
      {
        "id": "refactor",
        "tags": [
          "refactor"
        ],
        "en": {
          "title": "Refactor without changing behaviour",
          "body": "Refactor this code to improve {{goal|readability and testability}} without changing its external behaviour.\n\nRules: keep the public API identical, make small named steps, and explain each step in one line. Show the final code, then a short list of risks a reviewer should double-check.\n\n```\n{{code}}\n```"
        },
        "tr": {
          "title": "Davranışı değiştirmeden refactor et",
          "body": "Bu kodu dış davranışını değiştirmeden {{amaç|okunabilirlik ve test edilebilirlik}} açısından iyileştir.\n\nKurallar: genel API aynı kalsın, küçük ve adlandırılmış adımlarla ilerle, her adımı tek satırda açıkla. Son kodu göster, ardından inceleyicinin tekrar kontrol etmesi gereken riskleri kısaca listele.\n\n```\n{{kod}}\n```"
        }
      },
      {
        "id": "debug",
        "tags": [
          "debugging"
        ],
        "en": {
          "title": "Debug an error message",
          "body": "I get this error in {{environment|Node.js 20}}:\n\n```\n{{error}}\n```\n\nRelevant code:\n```\n{{code}}\n```\n\nGive me: the most likely root cause, 2-3 alternative causes ranked by likelihood, how to confirm each one (a log line, a command or a quick check), and the fix for the most likely cause. Ask for missing information instead of guessing."
        },
        "tr": {
          "title": "Hata mesajını ayıkla",
          "body": "{{ortam|Node.js 20}} ortamında şu hatayı alıyorum:\n\n```\n{{hata}}\n```\n\nİlgili kod:\n```\n{{kod}}\n```\n\nBana şunları ver: en olası kök neden, olasılığa göre sıralanmış 2-3 alternatif neden, her birini nasıl doğrulayacağım (bir log satırı, komut veya hızlı kontrol) ve en olası neden için düzeltme. Tahmin etmek yerine eksik bilgiyi sor."
        }
      },
      {
        "id": "sql",
        "tags": [
          "sql",
          "data"
        ],
        "en": {
          "title": "Write a SQL query from a schema",
          "body": "Database: {{dialect|PostgreSQL}}.\nSchema:\n```\n{{schema}}\n```\n\nWrite a query that: {{goal}}\n\nExplain the joins and filters in plain words, mention which indexes would help, and point out how NULLs and duplicates are handled. If the request is ambiguous, state your assumption first."
        },
        "tr": {
          "title": "Şemadan SQL sorgusu yaz",
          "body": "Veritabanı: {{lehçe|PostgreSQL}}.\nŞema:\n```\n{{şema}}\n```\n\nŞunu yapan bir sorgu yaz: {{amaç}}\n\nJoin ve filtreleri sade bir dille açıkla, hangi indekslerin yardımcı olacağını belirt, NULL ve tekrar eden kayıtların nasıl ele alındığını göster. İstek belirsizse önce varsayımını yaz."
        }
      },
      {
        "id": "regex",
        "tags": [
          "regex"
        ],
        "en": {
          "title": "Build and test a regular expression",
          "body": "Create a {{flavor|JavaScript}} regular expression that matches: {{should_match}}\nIt must NOT match: {{should_not_match|(you decide sensible negatives)}}\n\nReturn the pattern, a token-by-token explanation, a table of 6 test strings with expected match/no-match, and any catastrophic-backtracking risk."
        },
        "tr": {
          "title": "Düzenli ifade oluştur ve test et",
          "body": "Şunlarla eşleşen bir {{tür|JavaScript}} düzenli ifadesi oluştur: {{eşleşmeli}}\nŞunlarla EŞLEŞMEMELİ: {{eşleşmemeli|(mantıklı olumsuz örnekleri sen seç)}}\n\nDesen, parça parça açıklama, beklenen eşleşir/eşleşmez sonuçlarıyla 6 test metninden oluşan bir tablo ve aşırı geri izleme (catastrophic backtracking) riskini ver."
        }
      },
      {
        "id": "api-design",
        "tags": [
          "api",
          "design"
        ],
        "en": {
          "title": "Design a REST API endpoint",
          "body": "Design REST endpoints for this feature: {{feature}}\n\nInclude: resource names and URLs, methods, request/response JSON examples, status codes for success and each error, validation rules, pagination if lists are involved, and idempotency for writes. Keep it consistent with {{conventions|common JSON:API-style conventions}}. Finish with open questions for the product owner."
        },
        "tr": {
          "title": "REST API uç noktası tasarla",
          "body": "Bu özellik için REST uç noktaları tasarla: {{özellik}}\n\nŞunları ekle: kaynak adları ve URL'ler, metotlar, örnek istek/yanıt JSON'ları, başarı ve her hata için durum kodları, doğrulama kuralları, liste varsa sayfalama ve yazma işlemleri için idempotency. {{kurallar|yaygın JSON:API tarzı kurallarla}} tutarlı olsun. Ürün sahibine açık sorularla bitir."
        }
      },
      {
        "id": "commit",
        "tags": [
          "git"
        ],
        "en": {
          "title": "Write a commit message from a diff",
          "body": "Write a commit message for this diff using {{style|Conventional Commits}}.\n\n- Subject line max 72 characters, imperative mood.\n- Body: what changed and WHY, wrapped at 72 characters.\n- Mention breaking changes explicitly.\nDo not invent changes that are not in the diff.\n\n```diff\n{{diff}}\n```"
        },
        "tr": {
          "title": "Diff'ten commit mesajı yaz",
          "body": "Bu diff için {{biçim|Conventional Commits}} biçiminde bir commit mesajı yaz.\n\n- Başlık en fazla 72 karakter, emir kipinde.\n- Gövde: neyin değiştiği ve NEDEN, 72 karakterde satır kır.\n- Geriye dönük uyumsuz değişiklikleri açıkça belirt.\nDiff'te olmayan değişiklik uydurma.\n\n```diff\n{{diff}}\n```"
        }
      },
      {
        "id": "pr",
        "tags": [
          "git",
          "review"
        ],
        "en": {
          "title": "Pull request description",
          "body": "Write a pull request description for these changes:\n{{changes}}\n\nSections: Summary (2-3 sentences), Why, What changed (bullets), How to test (numbered steps), Risks and rollback, Screenshots/notes placeholder. Tone: {{tone|clear and neutral}}. Keep it skimmable."
        },
        "tr": {
          "title": "Pull request açıklaması",
          "body": "Bu değişiklikler için bir pull request açıklaması yaz:\n{{değişiklikler}}\n\nBölümler: Özet (2-3 cümle), Neden, Neler değişti (maddeler), Nasıl test edilir (numaralı adımlar), Riskler ve geri alma, Ekran görüntüsü/not yeri. Ton: {{ton|açık ve tarafsız}}. Hızlı okunabilir olsun."
        }
      },
      {
        "id": "perf",
        "tags": [
          "performance"
        ],
        "en": {
          "title": "Find performance bottlenecks",
          "body": "Analyse this code for performance. Expected input size: {{input_size|~100k items}}.\n\nGive the time and memory complexity of the hot paths, the top 3 likely bottlenecks, and concrete optimisations ordered by impact vs. effort. Say what to measure (profiler, benchmark) before changing anything.\n\n```\n{{code}}\n```"
        },
        "tr": {
          "title": "Performans darboğazlarını bul",
          "body": "Bu kodu performans açısından analiz et. Beklenen girdi boyutu: {{girdi boyutu|~100 bin öğe}}.\n\nKritik yolların zaman ve bellek karmaşıklığını, en olası 3 darboğazı ve etki/çaba oranına göre sıralanmış somut iyileştirmeleri ver. Bir şey değiştirmeden önce neyin ölçülmesi gerektiğini (profiler, benchmark) söyle.\n\n```\n{{kod}}\n```"
        }
      },
      {
        "id": "threat-model",
        "tags": [
          "security"
        ],
        "en": {
          "title": "Lightweight threat model",
          "body": "Create a lightweight threat model for: {{system}}\n\nList assets, entry points and trust boundaries. Then use STRIDE to list threats, each with likelihood, impact and a mitigation. Highlight the 3 things to fix first. Assume attackers know the source code."
        },
        "tr": {
          "title": "Hafif tehdit modeli",
          "body": "Şunun için hafif bir tehdit modeli oluştur: {{sistem}}\n\nVarlıkları, giriş noktalarını ve güven sınırlarını listele. Ardından STRIDE ile tehditleri olasılık, etki ve önlemle birlikte sırala. Önce düzeltilmesi gereken 3 şeyi vurgula. Saldırganların kaynak kodu bildiğini varsay."
        }
      },
      {
        "id": "translate-code",
        "tags": [
          "migration"
        ],
        "en": {
          "title": "Port code to another language",
          "body": "Port this code from {{from|Python}} to {{to|Go}}.\n\nKeep behaviour identical, use idiomatic {{to|Go}} (error handling, naming, standard library), and add a comment wherever the semantics differ (integer division, nulls, concurrency). List any library you had to replace.\n\n```\n{{code}}\n```"
        },
        "tr": {
          "title": "Kodu başka bir dile taşı",
          "body": "Bu kodu {{kaynak|Python}} dilinden {{hedef|Go}} diline taşı.\n\nDavranış aynı kalsın, {{hedef|Go}} için deyimsel yazım kullan (hata yönetimi, isimlendirme, standart kütüphane) ve anlamın farklılaştığı her yere yorum ekle (tam sayı bölmesi, null, eşzamanlılık). Değiştirmek zorunda kaldığın kütüphaneleri listele.\n\n```\n{{kod}}\n```"
        }
      },
      {
        "id": "docs",
        "tags": [
          "documentation"
        ],
        "en": {
          "title": "Write documentation / docstrings",
          "body": "Write {{format|JSDoc}} documentation for the code below: purpose, parameters with types, return value, thrown errors, and one short usage example per public function. Then write a README section \"Usage\" of at most {{words|150}} words.\n\n```\n{{code}}\n```"
        },
        "tr": {
          "title": "Dokümantasyon / docstring yaz",
          "body": "Aşağıdaki kod için {{biçim|JSDoc}} dokümantasyonu yaz: amaç, tipleriyle parametreler, dönüş değeri, fırlatılan hatalar ve her genel fonksiyon için kısa bir kullanım örneği. Ardından en fazla {{kelime|150}} kelimelik bir README \"Kullanım\" bölümü yaz.\n\n```\n{{kod}}\n```"
        }
      },
      {
        "id": "adr",
        "tags": [
          "architecture"
        ],
        "en": {
          "title": "Architecture decision record (ADR)",
          "body": "Write an Architecture Decision Record.\n\nDecision to make: {{decision}}\nOptions considered: {{options}}\nConstraints: {{constraints|team of 3, low budget, must ship in 4 weeks}}\n\nUse sections: Context, Options (pros/cons table), Decision, Consequences (positive and negative), and When to revisit."
        },
        "tr": {
          "title": "Mimari karar kaydı (ADR)",
          "body": "Bir Mimari Karar Kaydı yaz.\n\nVerilecek karar: {{karar}}\nDeğerlendirilen seçenekler: {{seçenekler}}\nKısıtlar: {{kısıtlar|3 kişilik ekip, düşük bütçe, 4 haftada çıkmalı}}\n\nBölümler: Bağlam, Seçenekler (artı/eksi tablosu), Karar, Sonuçlar (olumlu ve olumsuz) ve Ne zaman yeniden değerlendirilmeli."
        }
      },
      {
        "id": "shell",
        "tags": [
          "shell",
          "devops"
        ],
        "en": {
          "title": "Safe shell script",
          "body": "Write a {{shell|bash}} script that {{task}}.\n\nRequirements: `set -euo pipefail` (or equivalent), clear usage message, a --dry-run flag, no destructive command without confirmation, quote all variables. Explain each block in a short comment and list what to test on a throwaway machine first."
        },
        "tr": {
          "title": "Güvenli shell betiği",
          "body": "Şunu yapan bir {{kabuk|bash}} betiği yaz: {{görev}}.\n\nGereksinimler: `set -euo pipefail` (veya eşdeğeri), açık kullanım mesajı, --dry-run bayrağı, onaysız yıkıcı komut yok, tüm değişkenler tırnak içinde. Her bloğu kısa bir yorumla açıkla ve önce geçici bir makinede neyin test edilmesi gerektiğini listele."
        }
      }
    ]
  };
  if (typeof module === 'object' && module.exports) module.exports = pack;
  else { root.PM = root.PM || {}; (root.PM.PACK_DATA = root.PM.PACK_DATA || []).push(pack); }
})(typeof self !== 'undefined' ? self : this);
