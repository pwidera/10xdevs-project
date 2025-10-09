# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu
Projekt FlashAI ma na celu umożliwienie użytkownikom szybkiego tworzenia i zarządzania zestawami fiszek edukacyjnych. Aplikacja wykorzystuje modele LLM (poprzez API) do generowania sugestii fiszek na podstawie dostarczonego tekstu.

## 2. Problem użytkownika
Manualne tworzenie wysokiej jakości fiszek jest czasochłonne i żmudne, co zniechęca do stosowania efektywnej metody nauki opartej na powtórkach. Użytkownicy potrzebują narzędzia, które:
- Szybko przekształca fragmenty materiałów (notatki, skrypty, artykuły) w rzetelne fiszki.
- Pozwala selektywnie akceptować wyłącznie wartościowe fiszki.
- Umożliwia naukę w lekkim, nieskomplikowanym trybie bez konieczności oceniania odpowiedzi.

## 3. Wymagania funkcjonalne

3.1. Generowanie fiszek przez AI
- Użytkownik wkleja tekst (100–10 000 znaków) w języku PL lub EN.
- System generuje do 20 propozycji fiszek w formacie Q&A: przód i tył, każdy do 1000 znaków.
- Propozycje są jedynie prezentowane na ekranie; nie są zapisywane w bazie do czasu akceptacji.
- Użytkownik może:
      a) akceptować/odrzucać pojedyncze propozycje,
      b) użyć akcji zbiorczej „zatwierdź pozostałe” lub „odrzuć pozostałe”, obejmującej wszystkie jeszcze niezatwierdzone i nieodrzucone propozycje.
- Po akceptacji fiszka jest zapisywana w bazie jako finalna. Odrzucone propozycje przepadają.

3.2. Ręczne tworzenie fiszek
- Formularz dodawania fiszki w strukturze Q&A: przód/tył, każdy do 1000 znaków.
- Walidacje długości pól i brak pustych wartości.
- Zapis do bazy jako fiszka użytkownika.

3.3. Przeglądanie, wyszukiwanie i usuwanie fiszek
- Lista fiszek zapisanych (AI zaakceptowane oraz ręczne).
- Wyszukiwarka po treści przodu i tyłu.
- Usuwanie pojedynczych fiszek.
- Edycja inline z walidacją (przód/tył do 1000 znaków).

- Usuniecie jest trwale (brak kosza/undo w MVP).
- Edycja inline dotyczy wszystkich zapisanych fiszek (zarowno AI, jak i recznych).

3.4. Uwierzytelnianie i konta użytkowników
- Rejestracja/logowanie
- Zmiana hasła i usunięcie konta przez użytkownika wraz z przypisanymi do niego fiszkami.
- Minimalny zakres danych: e-mail + hasło.

- Wylogowanie użytkownika.
- Izolacja danych: użytkownik może wyświetlać, edytować i usuwać wyłącznie własne fiszki (brak współdzielenia w MVP).

3.5. Nauka i powtórki
- Dedykowana strona sesji nauki: prezentacja porcji 5 fiszek na raz.
- Kliknięcie fiszki odsłania tył (odpowiedź).
- Nawigacja „poprzednie/następne” ładuje kolejne/poprzednie porcje 5 fiszek.
- Integracja z gotowym algorytmem powtórek z biblioteki open source:
      a) system utrzymuje minimalne pola wymagane do podstawowego planowania powtórek (np. last_reviewed_at),
      b) brak ocen/stanu/akcji ze strony użytkownika w MVP; zdarzenie „przejrzenie/odsłonięcie” traktowane jest jako przegląd, a harmonogram następnej prezentacji wyznacza algorytm wg domyślnej ścieżki,
      c) mechanika doboru fiszek do sesji oparta na last_reviewed_at (najpierw najstarsze, potem najmłodsze).

3.7. Analityka i logowanie zdarzeń
- Dla każdego generowania: zapis liczby propozycji, liczby akceptacji i procentu akceptacji.
-Brak przechowywania propozycji odrzuconych ani surowych danych wprowadzonych do generatora poza kontekstem operacyjnym.

- Zapis znacznika czasu (timestamp) dla każdej sesji generowania.
- Zapis atrybutu pochodzenia (origin: AI-full/AI-edited/manual) przy zapisanej fiszce, aby umożliwić raportowanie udziału fiszek AI vs ręczne.

3.8. Walidacje i ograniczenia
- Wejście do generatora: 100–10000 znaków.
- Limit 20 wygenerowanych propozycji na jedną operację generowania.
- Limity pól fiszki: przód i tył do 1000 znaków.

## 4. Granice produktu
W zakresie MVP:
- Generowanie fiszek przez AI na podstawie wklejonego tekstu.
- Manualne tworzenie fiszek.
- Przeglądanie, wyszukiwanie, usuwanie; edycja tylko fiszek już zapisanych w bazie.
- Prosty system kont (Supabase) i minimalna nauka bez ocen.

Poza zakresem MVP:
- Zaawansowany algorytm powtórek (SuperMemo, rozbudowane SM-2, oceny, interwały).
- Import wielu formatów (PDF, DOCX itd.).
- Współdzielenie zestawów i integracje z platformami edukacyjnymi.
- Aplikacje mobilne.
- Automatyczne wykrywanie języka treści.
- Odporność na odświeżenie/utratę sieci podczas generowania (propozycje przepadają).
- SLA wydajnościowe i mechanizmy autosave/restore propozycji (utrata propozycji po odświeżeniu lub utracie sieci).
- Polityki treści i zgodność prawna wykraczająca poza podstawy (MVP).

## 5. Historyjki użytkowników

ID: US-001
Tytuł: Rejestracja konta
Opis: Jako nowy użytkownik chcę zarejestrować konto, aby móc przechowywać swoje fiszki.
Kryteria akceptacji:
- Formularz rejestracji z e-mailem i hasłem.
- Po rejestracji konto jest tworzone w bazie i użytkownik może się zalogować.
- Walidacja poprawności e-maila oraz minimalnej długości hasła.
- Błędy są wyświetlane w czytelnych komunikatach.

ID: US-002
Tytuł: Logowanie do aplikacji
Opis: Jako użytkownik chcę zalogować się do aplikacji, aby uzyskać dostęp do swoich fiszek.
Kryteria akceptacji:
- Formularz logowania weryfikuje dane w bazie.
- Po poprawnym logowaniu użytkownik trafia na stronę główną.
- W przypadku błędnych danych wyświetlany jest komunikat o błędzie.

ID: US-003
Tytuł: Zmiana hasła
Opis: Jako użytkownik chcę zmienić hasło, aby utrzymać bezpieczeństwo konta.
Kryteria akceptacji:
- Formularz zmiany hasła dostępny w ustawieniach konta.
- Walidacja minimalnej długości i zgodności pól hasła.
- Po zmianie hasła logowanie nowym hasłem działa poprawnie.

ID: US-004
Tytuł: Usunięcie konta
Opis: Jako użytkownik chcę usunąć swoje konto, aby moja obecność i dane zostały skasowane.
Kryteria akceptacji:
- Akcja usunięcia konta z potwierdzeniem.
- Usunięte zostają dane użytkownika i powiązane fiszki.
- Użytkownik zostaje wylogowany i widzi potwierdzenie usunięcia.

ID: US-005
Tytuł: Wprowadzenie tekstu do generatora
Opis: Jako użytkownik chcę wkleić tekst 100–10000 znaków, aby AI zaproponowało fiszki.
Kryteria akceptacji:
- Pole tekstowe z liczonymi znakami i walidacją zakresu.
- Przycisk uruchomienia generowania aktywny tylko dla poprawnego zakresu.
- Błąd walidacji poza zakresem z czytelnym komunikatem.

ID: US-006
Tytuł: Generowanie i przegląd propozycji fiszek
Opis: Jako użytkownik chcę zobaczyć do 20 propozycji fiszek (Q&A), by wybrać które zapisać.
Kryteria akceptacji:
- Lista do 20 propozycji z widocznym przodem i tyłem (do 1000 znaków każde).
- Każda propozycja ma akcje: zaakceptuj, odrzuć.
- Dostępne akcje zbiorcze: „zatwierdź pozostałe”, „odrzuć pozostałe”, które obejmują wszystkie jeszcze niezatwierdzone i nieodrzucone pozycje.
- Propozycje nieakceptowane nie są zapisywane w bazie.
- Po zakończeniu generowania system zapisuje w bazie procent akceptacji i liczebności.

ID: US-007
Tytuł: Zapis zaakceptowanych fiszek
Opis: Jako użytkownik chcę, aby zaakceptowane propozycje zostały zapisane na moim koncie.
Kryteria akceptacji:
- Po akceptacji fiszka trafia do bazy z pełną treścią Q&A.
- Odrzucone propozycje nie są zapisywane.
- Widoczny komunikat potwierdzający liczbę zapisanych fiszek.

ID: US-008
Tytuł: Ręczne dodanie fiszki
Opis: Jako użytkownik chcę ręcznie dodać fiszkę Q&A, aby uzupełnić swój zestaw.
Kryteria akceptacji:
- Formularz z przodem i tyłem (do 1000 znaków).
- Walidacje długości i pustych pól.
- Po zapisie fiszka jest widoczna na liście.

ID: US-009
Tytuł: Edycja ręcznie dodanej fiszki
Opis: Jako użytkownik chcę edytować treść wcześniej dodanej fiszki, by poprawić błędy.
Kryteria akceptacji:
- Edycja inline dostępna tylko dla fiszek istniejących w bazie.
- Walidacje długości 1000 znaków dla przodu i tyłu.
- Zapis zmian bez przeładowania strony.

ID: US-010
Tytuł: Oznaczanie pochodzenia fiszki (AI vs ręczna)
Opis: Jako użytkownik chcę rozróżnić fiszki wygenerowane przez AI od fiszek ręcznie dodanych, aby lepiej zarządzać swoim zestawem.
Kryteria akceptacji:
- Ikona/etykieta wskazująca pochodzenie (AI lub ręczna).
- Fiszki mogą być edytowane niezależnie od pochodzenia (zgodnie z 3.3).

ID: US-011
Tytuł: Wyszukiwanie fiszek
Opis: Jako użytkownik chcę wyszukiwać fiszki po treści pytania i odpowiedzi, by szybko je znaleźć.
Kryteria akceptacji:
- Pole wyszukiwania filtruje listę po wpisaniu frazy.
- Szukanie obejmuje przód i tył.
- Wyniki aktualizują się szybko i przewidywalnie.

ID: US-012
Tytuł: Usuwanie fiszki
Opis: Jako użytkownik chcę usunąć niepotrzebną fiszkę.
Kryteria akceptacji:
- Akcja usuń z potwierdzeniem.
- Po usunięciu fiszka znika z listy.
- Usunięcie jest trwałe.

ID: US-013
Tytuł: Sesja nauki – przegląd 5 fiszek
Opis: Jako użytkownik chcę uczyć się w porcjach po 5 fiszek, aby mieć jasny, prosty przepływ nauki.
Kryteria akceptacji:
- Widok prezentuje dokładnie 5 fiszek na stronę.
- Kliknięcie na fiszkę odsłania tył.
- Przyciski „poprzednie” i „następne” zmieniają porcję po 5 fiszek.
- Fiszki dobierane w pierwszej kolejności wg last_reviewed_at (zależnie od algorytmu powtórek).

ID: US-014
Tytuł: Podstawowa integracja z algorytmem powtórek
Opis: Jako użytkownik chcę, aby system planował kolejne prezentacje fiszek bez mojej ingerencji w oceny.
Kryteria akceptacji:
- Fiszki mają minimalny zestaw pól potrzebnych bibliotece (np. last_reviewed_at).
- Po przeglądzie fiszki algorytm ustala last_reviewed_at na aktualna datę
- Sesja nauki w pierwszej kolejności wyświetla fiszki najstarsze, potem najnowsze.

ID: US-015
Tytuł: Rejestrowanie metryk akceptacji
Opis: Jako właściciel produktu chcę mieć zapis procentu akceptacji dla każdego generowania, aby ocenić jakość AI.
Kryteria akceptacji:
- Po każdej sesji generowania zapisywany jest: liczba propozycji, liczba akceptacji, procent akceptacji.
- Dane są powiązane z znacznikiem czasu.
- Możliwe jest zagregowanie udziału fiszek AI vs ręczne.

ID: US-016
Tytuł: Obsługa braku zapisu propozycji przed akceptacją
Opis: Jako użytkownik rozumiem, że propozycje mogą zostać utracone w przypadku odświeżenia/utraty sieci przed akceptacją.
Kryteria akceptacji:
- Widoczny komunikat informujący o braku zapisu propozycji przed akceptacją.
- Po odświeżeniu ekranu propozycje nie są przywracane.
- System nie zapisuje propozycji tymczasowych w bazie.

ID: US-017
Tytuł: Wylogowanie
Opis: Jako użytkownik chcę się wylogować, aby zakończyć sesję.
Kryteria akceptacji:
- Przycisk „Wyloguj” dostępny w UI.
- Po wylogowaniu dostęp do danych użytkownika jest zablokowany do czasu ponownego logowania.

ID: US-018
Tytuł: Bezpieczny dostęp i autoryzacja
Opis: Jako zalogowany użytkownik chcę mieć pewność, że moje fiszki nie są dostępne dla innych użytkowników, aby zachować prywatność i bezpieczeństwo danych.
Kryteria akceptacji:
- Tylko zalogowany użytkownik może wyświetlać, edytować i usuwać swoje fiszki.
- Nie ma dostępu do fiszek innych użytkowników ani możliwości współdzielenia.

## 6. Metryki sukcesu
- 75% fiszek wygenerowanych przez AI jest akceptowane przez użytkownika w pojedynczym generowaniu (metryka logowana per sesję generowania).
- 75% wszystkich nowo powstałych fiszek jest tworzonych z wykorzystaniem AI (udział liczby zaakceptowanych fiszek AI w ogólnej liczbie nowo zapisanych fiszek w danym okresie operacyjnym – raportowane pomocniczo na podstawie logów zapisu).
- Adopcja funkcji generowania – odsetek sesji generowania zakończonych jakąkolwiek akceptacją ≥1 fiszki.