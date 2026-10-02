# -*- coding: utf-8 -*-
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

OUT = Path(__file__).resolve().parent / "TUBITAK_2209A_Arastirma_Onerisi.docx"


def set_run(run, size=9, bold=False, italic=False, color=None):
    run.font.name = "Arial"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color


def p(doc, text, *, size=9, bold=False, italic=False, center=False, justify=False, space_after=6, space_before=0):
    para = doc.add_paragraph()
    para.paragraph_format.space_after = Pt(space_after)
    para.paragraph_format.space_before = Pt(space_before)
    para.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    if center:
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif justify:
        para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run = para.add_run(text)
    set_run(run, size=size, bold=bold, italic=italic)
    return para


def mixed(doc, parts, *, space_after=6, justify=True):
    para = doc.add_paragraph()
    para.paragraph_format.space_after = Pt(space_after)
    para.paragraph_format.space_before = Pt(0)
    para.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    if justify:
        para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    for text, kwargs in parts:
        run = para.add_run(text)
        set_run(run, **kwargs)
    return para


def heading(doc, text, size=11):
    return p(doc, text, size=size, bold=True, space_before=10, space_after=6)


def sub(doc, text):
    return p(doc, text, size=10, bold=True, space_before=8, space_after=4)


def fill_table(table, rows, header=True):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, row in enumerate(rows):
        for j, cell_text in enumerate(row):
            cell = table.rows[i].cells[j]
            cell.text = ""
            para = cell.paragraphs[0]
            para.paragraph_format.space_after = Pt(0)
            para.paragraph_format.space_before = Pt(0)
            run = para.add_run(str(cell_text))
            set_run(run, size=8, bold=(header and i == 0))


def make():
    doc = Document()
    for sec in doc.sections:
        sec.top_margin = Cm(2)
        sec.bottom_margin = Cm(2)
        sec.left_margin = Cm(2)
        sec.right_margin = Cm(2)

    p(
        doc,
        "TÜBİTAK 2209-A ÜNİVERSİTE ÖĞRENCİLERİ ARAŞTIRMA PROJELERİ DESTEKLEME PROGRAMI",
        size=11,
        bold=True,
        center=True,
        space_after=4,
    )
    p(doc, "ARAŞTIRMA ÖNERİSİ FORMU", size=12, bold=True, center=True, space_after=2)
    p(
        doc,
        "[Çağrı yılı] Yılı  —  [Dönem] Dönem Başvurusu",
        size=9,
        italic=True,
        center=True,
        space_after=8,
    )
    p(
        doc,
        "Not (yüklemeden silin): Danışman adı, çağrı yılı/dönemi ve üniversite unvanını doldurun. "
        "TYBS bütçe rakamları bu belgedeki tablo ile aynı olmalıdır. Güncel şablonun yazı tipi/kenar "
        "boşluğu farklıysa içeriği resmi Word’e aktarın. Başlık ve metinde ticari ürün, firma veya "
        "marka adı kullanılmamıştır.",
        size=8,
        italic=True,
        space_after=10,
    )

    heading(doc, "A. GENEL BİLGİLER")
    genel = [
        ("Başvuru sahibinin adı soyadı:", "Yusuf Başkan"),
        ("Araştırma önerisinin başlığı:", "Simülasyon Tabanlı Atık Karar Desteğinde Kural Tabanlı Yönlendirme ve Toplama Turunun Performansının Ölçülmesi"),
        ("Danışmanın adı soyadı:", "[Akademik danışmanın unvanı, adı ve soyadı]"),
        ("Araştırmanın yürütüleceği kurum/kuruluş:", "[Öğrencinin kayıtlı olduğu üniversite]"),
        ("Önerilen süre:", "12 ay"),
        ("Talep edilen destek tavanı:", "Programın güncel çağrı metnindeki üst limit (resmî metinde 12.000 TL; bazı TTO duyurularında 9.000 TL). Aşağıdaki tablo 12.000 TL içindir; tavan 9.000 TL ise kalemler aynı gerekçeyle oransal küçültülür."),
    ]
    t = doc.add_table(rows=len(genel), cols=2)
    t.style = "Table Grid"
    fill_table(t, genel, header=False)

    heading(doc, "ÖZET")
    p(
        doc,
        "Türkçe özet; özgün değer, yöntem, yönetim ve yaygın etki başlıklarını kapsar "
        "(şablon: en fazla 450 kelime veya bir sayfa).",
        size=8,
        italic=True,
        space_after=4,
    )
    mixed(
        doc,
        [
            (
                "Özgün değer. ",
                {"size": 9, "bold": True},
            ),
            (
                "Endüstriyel atığın lisanslı tesise sevkı, toplama turunun planlanması ve doluluk "
                "projeksiyonu çoğu işletmede ayrı araçlarda veya sezgisel kararla yürür. Bu öneri yeni "
                "bir öğrenen model veya canlı elektronik belge iddiası taşımaz. Katkı, lisans ölçeğinde "
                "çalışır bir karar destek prototipi üzerinde kural tabanlı tesis yönlendirme, en yakın "
                "komşu tur ve kısa ufuklu doğrusal doluluk yürütmesinin aynı, tekrarlanabilir senaryo "
                "protokolüyle nicel olarak sınanmasıdır. Araştırma sorusu: kontrollü senaryoda kural "
                "yönlendirmesi altın standarda göre ne kadar uyumludur ve en yakın komşu tur rastgele "
                "tura göre mesafeyi azaltır mı?",
                {"size": 9},
            ),
        ],
    )
    mixed(
        doc,
        [
            ("Yöntem. ", {"size": 9, "bold": True}),
            (
                "Tasarım simülasyon tabanlı doğrulamadır [15]. Birincil veri sahadan zorunlu tutulmaz; "
                "üretim kuralı belgelenmiş sentetik/senaryo seti kullanılır. Yönlendirmede malzeme "
                "anahtar sözcüğü–tesis eşlemesi sınıflandırma problemi olarak ele alınır; altın standart "
                "danışman onaylı lisans hattı tanımıdır; metrikler doğruluk ve Cohen κ’dır [13]. Tur, "
                "araç rotalama yazınındaki kurucu sezgisel olarak en yakın komşudur [9][12]; taban "
                "çizgisi rastgele ziyaret sırasıdır. Doluluk için yedi günlük doğrusal projeksiyon MAE ve "
                "MAPE ile değerlendirilir [14]. Elektronik irsaliye ve konum izi canlı kamu sistemi "
                "değildir; doğruluk hesabına alınmaz. Ön çalışma: çalışır lisans prototipi mevcuttur.",
                {"size": 9},
            ),
        ],
    )
    mixed(
        doc,
        [
            ("Yönetim. ", {"size": 9, "bold": True}),
            (
                "Süre 12 aydır. Dört iş paketi vardır: senaryo protokolü, yönlendirme testi, tur "
                "karşılaştırması, doluluk ve satış–kayıt tutarlılığı (saha erişimi bu pakete gömülür). "
                "Literatür okuması ve sonuç raporu ayrı paket değildir. Riskler: saha verisi yokluğu, "
                "ağ/barındırma kesintisi, yüksek sınıflandırma veya tahmin hatası. B planı yerel senaryo, "
                "çevrimdışı çalışma ve parametre duyarlılığıdır; öğrenen modele geçilmez.",
                {"size": 9},
            ),
        ],
    )
    mixed(
        doc,
        [
            ("Yaygın etki. ", {"size": 9, "bold": True}),
            (
                "Beklenen çıktı ölçülmüş prototip, yayımlanabilir metrik tablosu ve bir öğrenci bildirisi "
                "taslağıdır. Sektörel fayda, yanlış tesise sevk ve gereksiz kilometrenin senaryo bazlı "
                "maliyet aralığı olarak tartışılır; ulusal piyasa etkisi iddia edilmez. Çalışma, yönetim "
                "bilişim sistemlerinde karar desteğinin simülasyonla doğrulanması örneği olarak sonraki "
                "üniversite–sanayi projesine ön çalışma sağlayabilir.",
                {"size": 9},
            ),
        ],
    )
    p(
        doc,
        "Anahtar kelimeler: atık lojistiği; karar destek sistemi; simülasyon doğrulaması; "
        "kural tabanlı yönlendirme; araç rotalama sezgiseli",
        size=9,
        italic=True,
        space_after=8,
    )

    heading(doc, "1. ÖZGÜN DEĞER")
    sub(doc, "1.1. Konunun önemi, özgün değer ve araştırma sorusu / hipotez")
    p(
        doc,
        "Atık hiyerarşisi ve lisanslı geri kazanım/bertaraf yükümlülüğü ulusal mevzuatta sabittir "
        "[1][2][3]. Taşıma izi ve ulusal form yükümlülüğü, atığın kayıtsız dolaşımını sınırlar [4]. "
        "Vergi usulünde e-irsaliye sevk belgesinin elektronik karşılığıdır [5]. Canlı kamu takip "
        "sistemleri bu çalışmanın kapsamı dışındadır. İşletme pratiğinde sorun sıklıkla "
        "mevzuatın yokluğu değil, malzeme–tesis eşlemesinin, toplama sırasının ve doluluk uyarısının "
        "tek bir bilgi sisteminde ölçülebilir olmamasıdır. Döngüsel ekonomi yazını kaynak döngüsünü "
        "kavramlaştırır [6][7]; karar destek sistemleri operasyonel kararı veri ve kural "
        "üzerinden destekler [8]. Atık toplama yazını sorunu araç rotalama (VRP) sınıfına koyar "
        "[9][10][11]. NP-zor yapı nedeniyle pratikte kurucu sezgiseller, özellikle en yakın komşu, "
        "yaygın kullanılır [12].",
        justify=True,
    )
    p(
        doc,
        "Bu alandaki lisans çalışmaları ya salt yazılım tanıtımı ya da sahaya erişilemediği için "
        "ölçümsüz kalma eğilimindedir. Öğrenen sınıflandırıcı veya canlı belge entegrasyonu iddia "
        "edildiğinde yöntem şeffaflığı düşer ve tekrarlanabilirlik zayıflar. Önerilen çalışmanın "
        "özgünlüğü yeni bir sezgisel icat etmek değil; lisans prototipinde (i) kural tabanlı tesis "
        "yönlendirmesini altın standarda karşı sınıflandırma olarak, (ii) en yakın komşu turu rastgele "
        "tura karşı mesafe olarak, (iii) kısa ufuklu doluluğu hata metrikleriyle aynı protokolde "
        "raporlamaktır. Sınır: canlı kamu e-belge ve telemetri yoktur; saha erişimi zorunlu değildir; "
        "veri sentetik/senaryo olabilir. Bu sınırlar zayıflık olarak değil, kapsam olarak yazılır.",
        justify=True,
    )
    mixed(
        doc,
        [
            ("Araştırma sorusu. ", {"size": 9, "bold": True}),
            (
                "Kontrollü senaryo verisi üzerinde kural tabanlı tesis yönlendirmesi, danışman onaylı "
                "lisans hattı altın standardına ne ölçüde uyar ve en yakın komşu toplama turu rastgele "
                "ziyaret sırasına göre mesafeyi azaltır mı?",
                {"size": 9},
            ),
        ],
    )
    mixed(
        doc,
        [
            ("Hipotezler. ", {"size": 9, "bold": True}),
            (
                "H1: Kural tablosunun altın standartla uyumu, rastgele tesis atamasından yüksektir "
                "(doğruluk ve Cohen κ). H2: En yakın komşu turun ortalama mesafesi, aynı nokta kümesinde "
                "rastgele sıradan düşüktür. H3: Yedi günlük doğrusal doluluk, üretim kuralı bilinen "
                "senaryoda raporlanabilir MAE/MAPE üretir. Hipotezler reddedilirse bilimsel çıktı yine "
                "tablodur; öğrenen modele geçilmez, parametre ve belirsiz malzeme sınıfı ayrıştırılır.",
                {"size": 9},
            ),
        ],
    )

    sub(doc, "1.2. Amaç ve hedefler")
    p(
        doc,
        "Amaç: Endüstriyel atık karar desteğinde kural tabanlı yönlendirme, en yakın komşu tur ve "
        "kısa ufuklu doluluk projeksiyonunun, 12 ay içinde simülasyon protokolüyle nicel olarak "
        "doğrulanması ve sınırlılıklarıyla birlikte raporlanması.",
        justify=True,
    )
    p(doc, "Hedefler (12 ayda ulaşılabilir):", bold=True, space_after=2)
    for item in [
        "H-1. Üretim kuralı, tohum ve alan sözlüğü yazılı en az 40 kontrollü senaryo seti oluşturmak (lot, doluluk, toplama noktası).",
        "H-2. Yönlendirmede karmaşıklık matrisi, doğruluk ve Cohen κ’yı altın standarda ve rastgele atama tabanına göre raporlamak.",
        "H-3. En yakın komşu turu rastgele tura göre ortalama km ve yüzde fark ile karşılaştırmak.",
        "H-4. Yedi günlük doluluk için MAE ve MAPE hesaplamak; satış kaydının stok bakiyesinden bağımsız “görünür kâr” üretmediğini tutarlılık kontrolüyle göstermek.",
        "H-5. Elektronik belge ve konum izinin simülasyon olduğunu raporda açık tutmak; saha yoksa gerekçeyi yazmak.",
        "H-6. Metrik tablosu ve yöntem/sınırlılık içeren sonuç raporunu ve çalışır prototip kopyasını teslim etmek; bir öğrenci bildirisi taslağı hazırlamak.",
    ]:
        p(doc, item, space_after=3)

    heading(doc, "2. YÖNTEM")
    p(
        doc,
        "Tasarım: simülasyon tabanlı yazılım doğrulaması [15]. Birim, lisans öğrencisi yürütücü; "
        "danışman altın standart ve bilimsel denetim. Evren, gerçek ulusal atık piyasası değil; "
        "tanımlı senaryo uzayıdır. Ön çalışma: karar destek prototipi (lot, rol, kural yönlendirme, "
        "tur, doluluk, belge simülasyonu) çalışır durumdadır. 12 ayın işi yazılımı sıfırdan üretmek "
        "değil, protokolü kilitlemek ve ölçmektir. Yöntem iş paketleriyle örtüşür (İP1–İP4).",
        justify=True,
    )

    sub(doc, "2.1. İP1 ile ilişkili: senaryo ve sentetik veri protokolü")
    p(
        doc,
        "Bağımsız girdi: malzeme sınıfı, kütle, kaynak koordinatı, başlangıç doluluğu, gün sayısı, "
        "gürültü düzeyi, rastgele tohum. Çıktı: lot ve doluluk zaman serisi, toplama noktaları. "
        "Üretici saha ölçümü diye sunulmaz; kural (dağılım, gürültü, tohum) rapora eklenir. Böylece "
        "danışman aynı tohumla sonucu yeniden üretir. Saha erişilirse aynı alan sözlüğü ile gözlem "
        "notu tutulur; saha yokluğu protokolü geçersiz kılmaz.",
        justify=True,
    )

    sub(doc, "2.2. İP2 ile ilişkili: kural tabanlı tesis yönlendirme")
    p(
        doc,
        "Yönlendirme öğrenen bir sınıflandırıcı değildir; malzeme tanımı–lisanslı hat eşlemesidir. "
        "Altın standart, mevzuattaki lisanslı tesise sevk ilkesine [2][3] dayanan danışman onaylı "
        "tablo. Karşılaştırma: rastgele tesis ataması. Metrik: doğruluk, Cohen κ [13], hata türü "
        "(yanlış geri kazanım hattı / belirsiz malzeme). Belirsiz girdiler ayrı sınıf olarak kodlanır. "
        "Başarı, tek bir yüzdeyi tutturmak değil; matrisin ve taban çizgisinin yayımlanabilir olmasıdır. "
        "Doğruluk rastgele atamayı geçmezse B planı: kural sadeleştirme ve belirsiz sınıfın genişletilmesi.",
        justify=True,
    )

    sub(doc, "2.3. İP3 ile ilişkili: toplama turu")
    p(
        doc,
        "Problem VRP/TSP sınıfındadır [9][10][11]. Çözüm tam sayısal eniyileme değil; kurucu sezgisel "
        "en yakın komşudur [12]. Uzaklık, düzlemde Haversine (km). Taban: aynı kümede rastgele sıra "
        "(sabit tohumlu tekrarlar). Metrik: ortalama tur km, yüzde fark. Eniyilik iddiası yoktur; "
        "TSP çözücüsünden sapma ayrıca raporlanmaz (kapsam dışı). Amaç, sezgisel turun rastgele "
        "plana göre ölçülebilir mesafe farkı üretip üretmediğidir (H2).",
        justify=True,
    )

    sub(doc, "2.4. İP4 ile ilişkili: doluluk, tutarlılık ve saha (varsa)")
    p(
        doc,
        "Doluluk: mevcut oran + lot kaynaklı kaba artışla yedi günlük doğrusal doldurma. Metrik: MAE, "
        "MAPE [14]. Üretim kuralı bilindiği için bu bir “gelecek tahmini yarışması” değil; yürütmenin "
        "kendi kuralına sapmasının belgelenmesidir. Ekonomik iz: gelir satış kaydından; maliyet kalemleri "
        "(işleme ve mesafe) senaryo varsayımıyla; stok bakiyesi kâr diye yazılmaz. Belge ve konum "
        "modülleri simülasyondur [5]; sınıflandırma/tur metriklerine girmez. Saha: mümkünse bir "
        "lisans hattı tanımının kural tablosuyla nitel karşılaştırması; yoksa gerekçeli not.",
        justify=True,
    )

    p(
        doc,
        "İstatistik: tanımlayıcı özet; yönlendirmede κ; tur tekrarlarında ortalama ve yüzde fark. "
        "Küçük n’de p-değeri şart değildir. Yazılım ortamı çevrimdışı çalışabilir; ağ hizmeti "
        "isteğe bağlıdır ve R2 riskinin B planıdır.",
        justify=True,
    )

    heading(doc, "3. PROJE YÖNETİMİ")
    sub(doc, "3.1. İş-zaman çizelgesi")
    p(
        doc,
        "Şablon uyarısı gereği literatür taraması, malzeme temini, sonuç raporu ve bildiri yazımı "
        "ayrı iş paketi değildir; ilgili paketin içinde yürütülür. Yürütücü tüm paketlerde yer alır; "
        "danışman her pakette bilimsel denetim sağlar.",
        size=8,
        italic=True,
    )

    ip_rows = [
        [
            "İP",
            "İş paketinin adı ve hedefleri",
            "Kim",
            "Ay",
            "Başarı ölçütü ve başarıya katkı",
        ],
        [
            "İP1",
            "Senaryo ve sentetik veri protokolü. Alan sözlüğü (lot, doluluk, nokta); üretim kuralı ve tohum; en az 40 senaryo. Hedef H-1.",
            "Yürütücü (danışman denetimi)",
            "1–3",
            "Sözlük + üretim kuralı yazılı; 40 senaryo aynı tohumla yeniden üretilir. Katkı %20.",
        ],
        [
            "İP2",
            "Kural tabanlı tesis yönlendirmenin sınanması. Altın standart tablosu; karmaşıklık matrisi; rastgele atama tabanı. Hedef H-2.",
            "Yürütücü (danışman altın standart)",
            "3–7",
            "Doğruluk, κ ve hata türü tablosu; rastgele tabanla karşılaştırma. Katkı %30.",
        ],
        [
            "İP3",
            "Toplama turu karşılaştırması. En yakın komşu vs rastgele sıra; km ve yüzde fark. Hedef H-3.",
            "Yürütücü",
            "5–9",
            "En az 40 nokta kümesinde ortalama km tablosu. Katkı %25.",
        ],
        [
            "İP4",
            "Doluluk hatası, satış–kayıt tutarlılığı; saha varsa nitel kontrol. Belge/konum simülasyon notu. Hedef H-4, H-5, H-6.",
            "Yürütücü (danışman rapor denetimi)",
            "7–12",
            "MAE/MAPE; tutarlılık kontrolü; sınırlılık maddesi; teslim paketi (rapor+kopya+bildiri taslağı). Katkı %25.",
        ],
    ]
    t2 = doc.add_table(rows=len(ip_rows), cols=5)
    t2.style = "Table Grid"
    fill_table(t2, ip_rows)

    p(doc, "İş paketlerinin başarıya katkı toplamı %100’dür.", size=8, italic=True, space_before=6)

    p(doc, "Zaman çizelgesi (ay, taralı paketler örtüşebilir):", bold=True, space_before=8)
    gantt = [
        ["Paket", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
        ["İP1", "X", "X", "X", "", "", "", "", "", "", "", "", ""],
        ["İP2", "", "", "X", "X", "X", "X", "X", "", "", "", "", ""],
        ["İP3", "", "", "", "", "X", "X", "X", "X", "X", "", "", ""],
        ["İP4", "", "", "", "", "", "", "X", "X", "X", "X", "X", "X"],
    ]
    t3 = doc.add_table(rows=len(gantt), cols=13)
    t3.style = "Table Grid"
    fill_table(t3, gantt)

    sub(doc, "3.2. Risk yönetimi")
    p(
        doc,
        "B planı temel hedeften (ölçüm protokolünün tamamlanması) sapmaz; öğrenen model veya canlı "
        "kamu entegrasyonuna geçiş B planı değildir.",
        size=8,
        italic=True,
    )
    risk = [
        ["İP No", "En önemli riskler", "Risk yönetimi (B planı)"],
        [
            "İP1",
            "Sahadan yeterli veri alınamaması; senaryonun gerçek dağılımı yansıtmaması.",
            "Birincil kanıt kontrollü sentetik set. Üretim kuralı açık yazılır. Saha yokluğu kapsam sınırı olarak rapora işlenir; protokol durmaz.",
        ],
        [
            "İP2",
            "Kuralın yüksek hata üretmesi (karışık malzeme, eksik anahtar sözcük); altın standardın geç netleşmesi.",
            "Belirsiz sınıf; kural sadeleştirme; rastgele atama tabanı ile göreli başarı. Öğrenen modele geçilmez. Danışman tablosu 3. aydan önce kilitlenir.",
        ],
        [
            "İP3",
            "Nokta sayısının azlığı veya koordinat hatalarının km farkını anlamsız kılması.",
            "Sabit tohumlu tekrar; aynı kümede rastgele taban. Fark negatifse bu bulgu olarak yazılır; TSP iddiası yoktur.",
        ],
        [
            "İP4",
            "Ağ/barındırma kesintisi; MAPE’nin yüksek çıkması; belgenin canlı sanılması.",
            "Ölçüm çevrimdışı kopyada tekrarlanır. Yüksek MAPE parametre duyarlılığıyla raporlanır. GİB/konum metrik dışı ve simülasyon diye sabitlenir.",
        ],
    ]
    t4 = doc.add_table(rows=len(risk), cols=3)
    t4.style = "Table Grid"
    fill_table(t4, risk)

    sub(doc, "3.3. Araştırma olanakları")
    olan = [
        ["Kuruluşta / yürütücüde bulunan altyapı", "Projede kullanım amacı"],
        [
            "Kişisel veya üniversite öğrenci laboratuvarı bilgisayarı (mevcut)",
            "Prototipin çalıştırılması, senaryo üretimi, metrik hesapları, rapor yazımı. Yeni dizüstü talep edilmez.",
        ],
        [
            "Açık kaynak yazılım geliştirme ortamı (mevcut ön çalışma)",
            "Kural, tur ve doluluk yürütmesinin tekrarlanabilir koşulması; çevrimdışı B planı.",
        ],
        [
            "Akademik danışman ve kütüphane erişimi",
            "Altın standart, kaynakça ve rapor denetimi.",
        ],
    ]
    t5 = doc.add_table(rows=len(olan), cols=2)
    t5.style = "Table Grid"
    fill_table(t5, olan)

    heading(doc, "4. YAYGIN ETKİ")
    p(
        doc,
        "Başarı, ticari ticarileşme değil; protokolün tamamlanması ve sınırlılıkların açık yazılmasıdır. "
        "Sayısal iddialar senaryo içi tasarruf aralığıyla sınırlıdır.",
        justify=True,
    )
    etki = [
        ["Yaygın etki türü", "Beklenen çıktı, sonuç ve etkiler"],
        [
            "Bilimsel / akademik (makale, bildiri, kitap bölümü, kitap)",
            "12. ayda 1 (bir) öğrenci bildirisi veya üniversite sempozyumu taslağı (özet–yöntem–tablo). SCI makale ve kitap taahhüt edilmez.",
        ],
        [
            "Ekonomik / ticari / sosyal (ürün, prototip, patent, veri belgeleme vb.)",
            "Ölçülmüş lisans prototipi ve senaryo veri seti belgelemesi. Patent, faydalı model, spin-off, üretim izni beklenmez. Ekonomik etki: yanlış yönlendirme ve fazla km’nin senaryo maliyet aralığı (ulusal piyasa etkisi yok). Elektronik belge canlı kamu hizmeti değildir.",
        ],
        [
            "Araştırmacı yetiştirilmesi ve yeni proje(ler)",
            "Yürütücünün araştırma tasarımı ve metrik raporu deneyimi. Müşteri kuruluş ve yürütücü öğretim üyesi oluşursa sonraki üniversite–sanayi çağrısına ön çalışma; bu önerinin teslim şartı değildir.",
        ],
    ]
    t6 = doc.add_table(rows=len(etki), cols=2)
    t6.style = "Table Grid"
    fill_table(t6, etki)

    heading(doc, "5. BÜTÇE TALEP ÇİZELGESİ")
    p(
        doc,
        "Destek öğrenci bursu değildir. Kongre, yayın, patent, konaklama ve gündelik yazılmaz. "
        "Faturalar yürütücü adına kesilir; demirbaş üniversite envanterine alınır. Kullanılmayan tutar iade edilir. "
        "Yazılım geliştirme ücreti ve kişisel bilgisayar talep edilmez; üretici ve ölçüm yürütücünün işidir.",
        justify=True,
    )
    butce = [
        ["Bütçe türü", "Tutar (TL)", "Talep gerekçesi (iş paketi)"],
        [
            "Sarf malzeme",
            "2.500",
            "İP1 ve İP4: kırtasiye, çıktı, yedek medya, basılı teknik kaynak. Tek kullanımlık sarf.",
        ],
        [
            "Makine / teçhizat (demirbaş)",
            "3.500",
            "İP1–İP4 ve teslim: harici depolama (~1 TB) ve taşınabilir bellek seti. Senaryo, yazılım kopyası ve rapor yedeği. Kişisel dizüstü alınmaz.",
        ],
        [
            "Hizmet alımı",
            "3.500",
            "İP4 / R2: isteğe bağlı 12 aylık barındırma ve alan adı (çevrimiçi tekrarın ölçümü). Asıl ölçüm çevrimdışıdır. Kullanılmazsa iade.",
        ],
        [
            "Ulaşım (seyahat)",
            "2.500",
            "İP4: lisans hattı gözlemi için yerleşim içi ulaşım. Konaklama ve yemek yok. Saha olmazsa kalem kullanılmaz, iade edilir.",
        ],
        ["TOPLAM", "12.000", "Çağrı tavanı 9.000 TL ise aynı gerekçeyle oransal indirilir."],
    ]
    t7 = doc.add_table(rows=len(butce), cols=3)
    t7.style = "Table Grid"
    fill_table(t7, butce)
    p(
        doc,
        "TYBS ekranındaki kalem tutarları bu tablo ile birebir aynı girilmelidir; çelişkide sistem kaydı esas alınır.",
        size=8,
        italic=True,
        space_before=6,
    )

    heading(doc, "6. BELİRTMEK İSTEDİĞİNİZ DİĞER KONULAR")
    p(
        doc,
        "Ön çalışma: yürütücü, lot kaydı, kural yönlendirme, en yakın komşu tur, doluluk projeksiyonu ve "
        "belge simülasyonu içeren çalışır bir lisans prototipine sahiptir. Bu durum 12 aylık işin bittiği "
        "anlamına gelmez; prototip ölçüm aracıdır. Canlı vergi belgesi, canlı atık takip kamu sistemi ve "
        "öğrenen model kapsam dışıdır. Etik kurul: insan katılımcılı klinik/anket çalışması öngörülmez; "
        "üç rolle kısa görev testi tanımlayıcıdır. Kurul istenirse danışman yönlendirmesiyle kabul sonrası "
        "yüklenir. Değerlendirmeye yardımcı görsel ekler, marka içermeyecek şekilde ayrıca tek PDF olarak "
        "sistemin ek alanına konabilir; zorunlu değildir.",
        justify=True,
    )

    heading(doc, "7. EKLER")
    sub(doc, "EK-1: Kaynaklar")
    refs = [
        "1. 2872 sayılı Çevre Kanunu (1983, değişiklikleriyle).",
        "2. Atık Yönetimi Yönetmeliği. Resmî Gazete, 2 Nisan 2015, Sayı: 29314.",
        "3. Sıfır Atık Yönetmeliği. Resmî Gazete, 12 Temmuz 2019, Sayı: 30829.",
        "4. Atıkların Karayolunda Taşınmasına İlişkin Tebliğ. Resmî Gazete, 20 Mart 2015, Sayı: 29301.",
        "5. 509 Sıra No.lu Vergi Usul Kanunu Genel Tebliği. Resmî Gazete, 19 Ekim 2019, Sayı: 30923.",
        "6. Kirchherr, J., Reike, D. ve Hekkert, M. (2017). Conceptualizing the circular economy: An analysis of 114 definitions. Resources, Conservation and Recycling, 127, 221–232.",
        "7. Geissdoerfer, M., Savaget, P., Bocken, N. M. P. ve Hultink, E. J. (2017). The circular economy – A new sustainability paradigm? Journal of Cleaner Production, 143, 757–768.",
        "8. Power, D. J. (2002). Decision Support Systems: Concepts and Resources for Managers. Quorum.",
        "9. Dantzig, G. B. ve Ramser, J. H. (1959). The truck dispatching problem. Management Science, 6(1), 80–91.",
        "10. Beliën, J., De Boeck, L. ve Van Ackere, J. (2014). Municipal solid waste collection and management problems: A literature review. Transportation Science, 48(1), 78–102. https://doi.org/10.1287/trsc.1120.0448",
        "11. Toth, P. ve Vigo, D. (Ed.). (2014). Vehicle Routing: Problems, Methods, and Applications (2. bs.). SIAM.",
        "12. Solomon, M. M. (1987). Algorithms for the vehicle routing and scheduling problems with time window constraints. Operations Research, 35(2), 254–265.",
        "13. Cohen, J. (1960). A coefficient of agreement for nominal scales. Educational and Psychological Measurement, 20(1), 37–46.",
        "14. Hyndman, R. J. ve Koehler, A. B. (2006). Another look at measures of forecast accuracy. International Journal of Forecasting, 22(4), 679–688.",
        "15. Sargent, R. G. (2010). Verification and validation of simulation models. Proceedings of the 2010 Winter Simulation Conference, 166–183.",
    ]
    for r in refs:
        p(doc, r, space_after=4)

    p(
        doc,
        "Kaynakça, atığın lisanslı tesise yöneltilmesi ve taşıma belgesi [1]–[4], e-belgenin vergi usulündeki yeri [5], "
        "karar destek çerçevesi [8], VRP/sezgisel doğası [9]–[12] ve "
        "raporlanan metrikler [13]–[14] ile simülasyon doğrulamasını [15] temellendirir. Çalışma bu kaynakların "
        "birebir yazılımla uygulanması değil; aynı kavramların lisans prototipinde ölçülmesidir.",
        justify=True,
        space_before=8,
    )

    note = doc.add_paragraph()
    note.paragraph_format.space_before = Pt(16)
    run = note.add_run(
        "Yükleme kontrolü: (1) danışman ve üniversite alanları, (2) çağrı yılı/dönemi, (3) tavan 9.000 ise bütçe, "
        "(4) resmi şablona aktarım, (5) TYBS bilimsel alan/anahtar kelime, (6) bu sayfadaki gri notun silinmesi."
    )
    set_run(run, size=8, italic=True, color=RGBColor(0x66, 0x66, 0x66))

    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    make()
