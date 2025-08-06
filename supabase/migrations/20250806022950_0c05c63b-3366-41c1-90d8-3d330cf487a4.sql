-- Create comprehensive Islamic content database with proper structure

-- Create Quran verses table
CREATE TABLE IF NOT EXISTS public.quran_verses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surah_number INTEGER NOT NULL,
  surah_name TEXT NOT NULL,
  verse_number INTEGER NOT NULL,
  arabic_text TEXT NOT NULL,
  translation_english TEXT NOT NULL,
  transliteration TEXT,
  revelation_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(surah_number, verse_number)
);

-- Create Hadith collection table
CREATE TABLE IF NOT EXISTS public.hadith_collection (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_name TEXT NOT NULL, -- e.g., 'Sahih Bukhari', 'Sahih Muslim'
  book_number INTEGER,
  hadith_number INTEGER NOT NULL,
  arabic_text TEXT NOT NULL,
  translation_english TEXT NOT NULL,
  narrator TEXT NOT NULL,
  grade TEXT, -- e.g., 'Sahih', 'Hasan', 'Da'if'
  topic TEXT,
  reference TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_name, hadith_number)
);

-- Create Islamic scholars table for authenticity
CREATE TABLE IF NOT EXISTS public.islamic_scholars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT,
  birth_year INTEGER,
  death_year INTEGER,
  school_of_thought TEXT, -- e.g., 'Hanafi', 'Maliki', 'Shafi'i', 'Hanbali'
  specialization TEXT[],
  biography TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content verification table
CREATE TABLE IF NOT EXISTS public.content_verification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('quran', 'hadith', 'scholarly')),
  content_id UUID NOT NULL,
  verified_by UUID REFERENCES public.islamic_scholars(id),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'disputed', 'rejected')),
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_quran_surah_verse ON public.quran_verses(surah_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_quran_translation_search ON public.quran_verses USING gin(to_tsvector('english', translation_english));
CREATE INDEX IF NOT EXISTS idx_hadith_collection_ref ON public.hadith_collection(collection_name, hadith_number);
CREATE INDEX IF NOT EXISTS idx_hadith_translation_search ON public.hadith_collection USING gin(to_tsvector('english', translation_english));
CREATE INDEX IF NOT EXISTS idx_hadith_topic ON public.hadith_collection(topic);

-- Enable RLS on all tables
ALTER TABLE public.quran_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadith_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_scholars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_verification ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (Islamic content should be accessible to all)
CREATE POLICY "Quran verses are publicly readable" ON public.quran_verses
  FOR SELECT USING (true);

CREATE POLICY "Hadith collection is publicly readable" ON public.hadith_collection
  FOR SELECT USING (true);

CREATE POLICY "Islamic scholars info is publicly readable" ON public.islamic_scholars
  FOR SELECT USING (true);

CREATE POLICY "Content verification is publicly readable" ON public.content_verification
  FOR SELECT USING (true);

-- Insert sample Quran verses (Al-Fatiha - The Opening)
INSERT INTO public.quran_verses (surah_number, surah_name, verse_number, arabic_text, translation_english, transliteration, revelation_order) VALUES
(1, 'Al-Fatiha', 1, 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', 'Bismillahir-Rahmanir-Rahim', 5),
(1, 'Al-Fatiha', 2, 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'All praise is due to Allah, Lord of the worlds.', 'Alhamdulillahi rabbil-alameen', 5),
(1, 'Al-Fatiha', 3, 'الرَّحْمَٰنِ الرَّحِيمِ', 'The Entirely Merciful, the Especially Merciful,', 'Ar-Rahmanir-Rahim', 5),
(1, 'Al-Fatiha', 4, 'مَالِكِ يَوْمِ الدِّينِ', 'Sovereign of the Day of Recompense.', 'Maliki yawmid-deen', 5),
(1, 'Al-Fatiha', 5, 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'It is You we worship and You we ask for help.', 'Iyyaka na''budu wa iyyaka nasta''een', 5),
(1, 'Al-Fatiha', 6, 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'Guide us to the straight path', 'Ihdinassiratal-mustaqeem', 5),
(1, 'Al-Fatiha', 7, 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.', 'Siratal-lazeena an''amta alayhim ghayril-maghdoobi alayhim wa lad-dalleen', 5)
ON CONFLICT (surah_number, verse_number) DO NOTHING;

-- Insert key verses about patience and trust
INSERT INTO public.quran_verses (surah_number, surah_name, verse_number, arabic_text, translation_english, transliteration) VALUES
(2, 'Al-Baqarah', 155, 'وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ وَنَقْصٍ مِّنَ الْأَمْوَالِ وَالْأَنفُسِ وَالثَّمَرَاتِ ۗ وَبَشِّرِ الصَّابِرِينَ', 'And We will surely test you with something of fear and hunger and a loss of wealth and lives and fruits, but give good tidings to the patient,', 'Wa lanabluwannakum bi-shay''in minal-khawfi wal-joo''i wa naqsin minal-amwali wal-anfusi was-thamarati wa bashshiris-sabireen'),
(65, 'At-Talaq', 3, 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ ۚ قَدْ جَعَلَ اللَّهُ لِكُلِّ شَيْءٍ قَدْرًا', 'And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose. Allah has already set for everything a [decreed] extent.', 'Wa man yatawakkal alallahi fahuwa hasbuhu innallaha balighu amrihi qad ja''alallahu likulli shay''in qadra')
ON CONFLICT (surah_number, verse_number) DO NOTHING;

-- Insert sample Hadith from Sahih Bukhari
INSERT INTO public.hadith_collection (collection_name, book_number, hadith_number, arabic_text, translation_english, narrator, grade, topic, reference) VALUES
('Sahih Bukhari', 1, 1, 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى', 'Actions are but by intention and every man shall have only that which he intended.', 'Umar ibn Al-Khattab', 'Sahih', 'Intention', 'Sahih Bukhari 1'),
('Sahih Bukhari', 81, 6011, 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', 'None of you truly believes until he wishes for his brother what he wishes for himself.', 'Anas ibn Malik', 'Sahih', 'Brotherhood', 'Sahih Bukhari 13'),
('Sahih Muslim', 1, 1, 'بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ', 'Islam is built on five [principles].', 'Abdullah ibn Umar', 'Sahih', 'Five Pillars', 'Sahih Muslim 16')
ON CONFLICT (collection_name, hadith_number) DO NOTHING;

-- Insert sample Islamic scholars
INSERT INTO public.islamic_scholars (name, full_name, birth_year, death_year, school_of_thought, specialization, biography) VALUES
('Imam Bukhari', 'Muhammad ibn Ismail al-Bukhari', 810, 870, 'Hadith Scholar', ARRAY['Hadith Science', 'Islamic Jurisprudence'], 'One of the most important hadith scholars in Islamic history, compiler of Sahih al-Bukhari.'),
('Imam Muslim', 'Muslim ibn al-Hajjaj', 815, 875, 'Hadith Scholar', ARRAY['Hadith Science'], 'Compiler of Sahih Muslim, one of the six major hadith collections.'),
('Imam Shafi', 'Muhammad ibn Idris ash-Shafi''i', 767, 820, 'Shafi''i', ARRAY['Islamic Jurisprudence', 'Usul al-Fiqh'], 'Founder of the Shafi''i school of Islamic jurisprudence.')
ON CONFLICT DO NOTHING;

-- Create function to search Islamic content with relevance scoring
CREATE OR REPLACE FUNCTION search_islamic_content(search_query TEXT, result_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  content_type TEXT,
  id UUID,
  content TEXT,
  reference TEXT,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'quran'::TEXT as content_type,
    q.id,
    q.translation_english as content,
    CONCAT('Quran ', q.surah_name, ' ', q.surah_number, ':', q.verse_number) as reference,
    ts_rank(to_tsvector('english', q.translation_english), plainto_tsquery('english', search_query)) as relevance_score
  FROM public.quran_verses q
  WHERE to_tsvector('english', q.translation_english) @@ plainto_tsquery('english', search_query)
  
  UNION ALL
  
  SELECT 
    'hadith'::TEXT as content_type,
    h.id,
    h.translation_english as content,
    h.reference,
    ts_rank(to_tsvector('english', h.translation_english), plainto_tsquery('english', search_query)) as relevance_score
  FROM public.hadith_collection h
  WHERE to_tsvector('english', h.translation_english) @@ plainto_tsquery('english', search_query)
  
  ORDER BY relevance_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_quran_verses_updated_at BEFORE UPDATE ON public.quran_verses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hadith_collection_updated_at BEFORE UPDATE ON public.hadith_collection FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();