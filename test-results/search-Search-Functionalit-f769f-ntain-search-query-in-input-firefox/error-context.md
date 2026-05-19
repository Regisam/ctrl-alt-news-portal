# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.spec.ts >> Search Functionality >> should maintain search query in input
- Location: e2e/search.spec.ts:69:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "robotics"
Received string:    ""
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e6]:
        - link "CTRL + ALT News — Página inicial" [ref=e7] [cursor=pointer]:
          - /url: /
          - img [ref=e8]
          - img "CTRL + ALT News" [ref=e9]
        - navigation "Main navigation" [ref=e10]:
          - button "AI news section" [ref=e11] [cursor=pointer]: AI
          - button "Science news section" [ref=e12] [cursor=pointer]: SCIENCE
          - button "Robotics news section" [ref=e13] [cursor=pointer]: ROBOTICS
          - button "Gadgets reviews and deals" [ref=e14] [cursor=pointer]: GADGETS
        - generic [ref=e15]:
          - button "Open search" [ref=e17] [cursor=pointer]:
            - img [ref=e18]
            - generic [ref=e21]: Search
          - group "Language selection" [ref=e22]:
            - img [ref=e23]
            - button "Mudar para Português" [ref=e27] [cursor=pointer]: PT
            - generic [ref=e28]: "|"
            - button "Switch to English" [pressed] [ref=e29] [cursor=pointer]: EN
    - main [ref=e30]:
      - generic [ref=e31]:
        - button "Back" [ref=e32] [cursor=pointer]:
          - img [ref=e33]
          - text: Back
        - generic [ref=e37]:
          - img
          - searchbox "Search articles, categories, authors…" [ref=e38]
        - generic [ref=e39]:
          - button "ALL" [ref=e40] [cursor=pointer]
          - button "AI" [ref=e41] [cursor=pointer]
          - button "SCIENCE" [ref=e42] [cursor=pointer]
          - button "ROBOTICS" [ref=e43] [cursor=pointer]
        - generic [ref=e44]:
          - link [ref=e45] [cursor=pointer]:
            - /url: /article/101
            - article [ref=e46]:
              - generic [ref=e48]:
                - generic [ref=e49]:
                  - generic [ref=e50]: AI
                  - generic [ref=e51]: Alex Chen
                - heading "GPT-5 Reasoning Engine Surpasses Human Experts" [level=3] [ref=e52]
                - generic [ref=e53]:
                  - generic [ref=e54]:
                    - img [ref=e55]
                    - text: 5 min
                  - generic [ref=e58]:
                    - img [ref=e59]
                    - text: 48.2K
                  - generic [ref=e62]: Feb 24, 2026
          - link [ref=e63] [cursor=pointer]:
            - /url: /article/102
            - article [ref=e64]:
              - generic [ref=e66]:
                - generic [ref=e67]:
                  - generic [ref=e68]: AI
                  - generic [ref=e69]: Dr. Sarah Kim
                - heading "AI Designs New Antibiotics Resistant to Superbugs" [level=3] [ref=e70]
                - generic [ref=e71]:
                  - generic [ref=e72]:
                    - img [ref=e73]
                    - text: 6 min
                  - generic [ref=e76]:
                    - img [ref=e77]
                    - text: 35.7K
                  - generic [ref=e80]: Feb 23, 2026
          - link [ref=e81] [cursor=pointer]:
            - /url: /article/103
            - article [ref=e82]:
              - generic [ref=e84]:
                - generic [ref=e85]:
                  - generic [ref=e86]: AI
                  - generic [ref=e87]: James Wright
                - heading "Neural Interface Lets Paralysed Patients Type at 200 WPM" [level=3] [ref=e88]
                - generic [ref=e89]:
                  - generic [ref=e90]:
                    - img [ref=e91]
                    - text: 7 min
                  - generic [ref=e94]:
                    - img [ref=e95]
                    - text: 44.7K
                  - generic [ref=e98]: Feb 22, 2026
          - link [ref=e99] [cursor=pointer]:
            - /url: /article/105
            - article [ref=e100]:
              - generic [ref=e102]:
                - generic [ref=e103]:
                  - generic [ref=e104]: AI
                  - generic [ref=e105]: Manus AI
                - 'heading "The Agentic AI Revolution: Model Context Protocol (MCP) Goes Mainstream" [level=3] [ref=e106]'
                - generic [ref=e107]:
                  - generic [ref=e108]:
                    - img [ref=e109]
                    - text: 6 min
                  - generic [ref=e112]:
                    - img [ref=e113]
                    - text: 67.4K
                  - generic [ref=e116]: Feb 21, 2026
          - link [ref=e117] [cursor=pointer]:
            - /url: /article/106
            - article [ref=e118]:
              - generic [ref=e120]:
                - generic [ref=e121]:
                  - generic [ref=e122]: AI
                  - generic [ref=e123]: Manus AI
                - heading "Daily Edition — AI, Science, Robotics & Gadgets Roundup" [level=3] [ref=e124]
                - generic [ref=e125]:
                  - generic [ref=e126]:
                    - img [ref=e127]
                    - text: 12 min
                  - generic [ref=e130]:
                    - img [ref=e131]
                    - text: 89.2K
                  - generic [ref=e134]: Feb 21, 2026
          - link [ref=e135] [cursor=pointer]:
            - /url: /article/104
            - article [ref=e136]:
              - generic [ref=e138]:
                - generic [ref=e139]:
                  - generic [ref=e140]: AI
                  - generic [ref=e141]: Marcus Lee
                - 'heading "NVIDIA Blackwell Ultra: The GPU That Runs AGI" [level=3] [ref=e142]'
                - generic [ref=e143]:
                  - generic [ref=e144]:
                    - img [ref=e145]
                    - text: 4 min
                  - generic [ref=e148]:
                    - img [ref=e149]
                    - text: 52.1K
                  - generic [ref=e152]: Feb 21, 2026
          - link [ref=e153] [cursor=pointer]:
            - /url: /article/201
            - article [ref=e154]:
              - generic [ref=e156]:
                - generic [ref=e157]:
                  - generic [ref=e158]: SCIENCE
                  - generic [ref=e159]: Dr. Maria Santos
                - heading "CRISPR 3.0 Edits Genes With Zero Off-Target Errors" [level=3] [ref=e160]
                - generic [ref=e161]:
                  - generic [ref=e162]:
                    - img [ref=e163]
                    - text: 8 min
                  - generic [ref=e166]:
                    - img [ref=e167]
                    - text: 38.9K
                  - generic [ref=e170]: Feb 24, 2026
          - link [ref=e171] [cursor=pointer]:
            - /url: /article/202
            - article [ref=e172]:
              - generic [ref=e174]:
                - generic [ref=e175]:
                  - generic [ref=e176]: SCIENCE
                  - generic [ref=e177]: Dr. Elena Vasquez
                - heading "James Webb Captures First Image of an Earth-Like Exoplanet" [level=3] [ref=e178]
                - generic [ref=e179]:
                  - generic [ref=e180]:
                    - img [ref=e181]
                    - text: 6 min
                  - generic [ref=e184]:
                    - img [ref=e185]
                    - text: 61.3K
                  - generic [ref=e188]: Feb 23, 2026
          - link [ref=e189] [cursor=pointer]:
            - /url: /article/203
            - article [ref=e190]:
              - generic [ref=e192]:
                - generic [ref=e193]:
                  - generic [ref=e194]: SCIENCE
                  - generic [ref=e195]: Prof. Raj Patel
                - heading "Room-Temperature Superconductor Confirmed by Three Labs" [level=3] [ref=e196]
                - generic [ref=e197]:
                  - generic [ref=e198]:
                    - img [ref=e199]
                    - text: 9 min
                  - generic [ref=e202]:
                    - img [ref=e203]
                    - text: 29.4K
                  - generic [ref=e206]: Feb 22, 2026
          - link [ref=e207] [cursor=pointer]:
            - /url: /article/204
            - article [ref=e208]:
              - generic [ref=e210]:
                - generic [ref=e211]:
                  - generic [ref=e212]: SCIENCE
                  - generic [ref=e213]: Dr. Yuki Tanaka
                - heading "Dark Matter Signal Detected at CERN Collider" [level=3] [ref=e214]
                - generic [ref=e215]:
                  - generic [ref=e216]:
                    - img [ref=e217]
                    - text: 7 min
                  - generic [ref=e220]:
                    - img [ref=e221]
                    - text: 43.8K
                  - generic [ref=e224]: Feb 21, 2026
          - link [ref=e225] [cursor=pointer]:
            - /url: /article/205
            - article [ref=e226]:
              - generic [ref=e228]:
                - generic [ref=e229]:
                  - generic [ref=e230]: SCIENCE
                  - generic [ref=e231]: Manus AI
                - heading "\"Ushikuvirus\" Giant Virus Discovery Could Rewrite the Origin of Complex Life" [level=3] [ref=e232]
                - generic [ref=e233]:
                  - generic [ref=e234]:
                    - img [ref=e235]
                    - text: 7 min
                  - generic [ref=e238]:
                    - img [ref=e239]
                    - text: 31.5K
                  - generic [ref=e242]: Feb 21, 2026
          - link [ref=e243] [cursor=pointer]:
            - /url: /article/206
            - article [ref=e244]:
              - generic [ref=e246]:
                - generic [ref=e247]:
                  - generic [ref=e248]: SCIENCE
                  - generic [ref=e249]: Manus AI
                - 'heading "Samsung Galaxy Unpacked 2026: The Galaxy S26 Series Is Set to Launch on 25th February" [level=3] [ref=e250]'
                - generic [ref=e251]:
                  - generic [ref=e252]:
                    - img [ref=e253]
                    - text: 5 min
                  - generic [ref=e256]:
                    - img [ref=e257]
                    - text: 55.8K
                  - generic [ref=e260]: Feb 21, 2026
          - link [ref=e261] [cursor=pointer]:
            - /url: /article/301
            - article [ref=e262]:
              - generic [ref=e264]:
                - generic [ref=e265]:
                  - generic [ref=e266]: ROBOTICS
                  - generic [ref=e267]: James Wright
                - heading "Tesla Optimus Gen 3 Begins Full Factory Deployment" [level=3] [ref=e268]
                - generic [ref=e269]:
                  - generic [ref=e270]:
                    - img [ref=e271]
                    - text: 5 min
                  - generic [ref=e274]:
                    - img [ref=e275]
                    - text: 57.2K
                  - generic [ref=e278]: Feb 24, 2026
          - link [ref=e279] [cursor=pointer]:
            - /url: /article/302
            - article [ref=e280]:
              - generic [ref=e282]:
                - generic [ref=e283]:
                  - generic [ref=e284]: ROBOTICS
                  - generic [ref=e285]: Marcus Lee
                - heading "Boston Dynamics Atlas 3.0 Learns New Skills in Real Time" [level=3] [ref=e286]
                - generic [ref=e287]:
                  - generic [ref=e288]:
                    - img [ref=e289]
                    - text: 6 min
                  - generic [ref=e292]:
                    - img [ref=e293]
                    - text: 29.4K
                  - generic [ref=e296]: Feb 23, 2026
          - link [ref=e297] [cursor=pointer]:
            - /url: /article/303
            - article [ref=e298]:
              - generic [ref=e300]:
                - generic [ref=e301]:
                  - generic [ref=e302]: ROBOTICS
                  - generic [ref=e303]: Dr. Sarah Kim
                - heading "Surgical Robots Perform 10,000 Procedures Without Human Assist" [level=3] [ref=e304]
                - generic [ref=e305]:
                  - generic [ref=e306]:
                    - img [ref=e307]
                    - text: 7 min
                  - generic [ref=e310]:
                    - img [ref=e311]
                    - text: 41.6K
                  - generic [ref=e314]: Feb 22, 2026
          - link [ref=e315] [cursor=pointer]:
            - /url: /article/304
            - article [ref=e316]:
              - generic [ref=e318]:
                - generic [ref=e319]:
                  - generic [ref=e320]: ROBOTICS
                  - generic [ref=e321]: Prof. Raj Patel
                - heading "Micro-Robots Deliver Cancer Drugs Directly to Tumours" [level=3] [ref=e322]
                - generic [ref=e323]:
                  - generic [ref=e324]:
                    - img [ref=e325]
                    - text: 8 min
                  - generic [ref=e328]:
                    - img [ref=e329]
                    - text: 33.1K
                  - generic [ref=e332]: Feb 21, 2026
          - link [ref=e333] [cursor=pointer]:
            - /url: /article/305
            - article [ref=e334]:
              - generic [ref=e336]:
                - generic [ref=e337]:
                  - generic [ref=e338]: ROBOTICS
                  - generic [ref=e339]: Manus AI
                - heading "China's Humanoid Robots Steal the Show at Spring Festival Gala" [level=3] [ref=e340]
                - generic [ref=e341]:
                  - generic [ref=e342]:
                    - img [ref=e343]
                    - text: 6 min
                  - generic [ref=e346]:
                    - img [ref=e347]
                    - text: 74.3K
                  - generic [ref=e350]: Feb 21, 2026
    - contentinfo "Site footer" [ref=e351]:
      - generic [ref=e352]:
        - generic [ref=e353]:
          - generic [ref=e354]:
            - link "CTRL + ALT News — Home" [ref=e355] [cursor=pointer]:
              - /url: /
              - img "CTRL + ALT News" [ref=e356]
            - paragraph [ref=e357]: Your source for the future of technology.
            - list "Social media links" [ref=e358]:
              - button "Follow on X (Twitter)" [ref=e359] [cursor=pointer]: X
              - button "Watch on YouTube" [ref=e360] [cursor=pointer]: YT
              - button "Follow on Instagram" [ref=e361] [cursor=pointer]: IG
              - button "Join on Telegram" [ref=e362] [cursor=pointer]: TG
          - navigation "News categories" [ref=e363]:
            - heading "Categories" [level=2] [ref=e364]
            - button "AI news section" [ref=e365] [cursor=pointer]: AI
            - button "Science news section" [ref=e366] [cursor=pointer]: SCIENCE
            - button "Robotics news section" [ref=e367] [cursor=pointer]: ROBOTICS
            - button "Gadgets reviews" [ref=e368] [cursor=pointer]: GADGETS
          - navigation "Company links" [ref=e369]:
            - heading "Company" [level=2] [ref=e370]
            - link "About" [ref=e371] [cursor=pointer]:
              - /url: /about
            - link "Contact" [ref=e372] [cursor=pointer]:
              - /url: /contact
            - button "Advertise" [ref=e373] [cursor=pointer]
            - link "Sitemap" [ref=e374] [cursor=pointer]:
              - /url: /sitemap.xml
          - navigation "Legal links" [ref=e375]:
            - heading "Legal" [level=2] [ref=e376]
            - link "Privacy Policy" [ref=e377] [cursor=pointer]:
              - /url: /privacy
            - link "Terms of Use" [ref=e378] [cursor=pointer]:
              - /url: /terms
        - generic [ref=e380]:
          - paragraph [ref=e381]: © 2026 CTRL + ALT News. All rights reserved.
          - paragraph [ref=e382]: "Affiliate disclosure: Some links may earn us a commission at no extra cost to you."
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { HomePage } from './fixtures/home.page';
  3   | import { SearchPage } from './fixtures/search.page';
  4   | import { ArticlePage } from './fixtures/article.page';
  5   | 
  6   | test.describe('Search Functionality', () => {
  7   |   let homePage: HomePage;
  8   |   let searchPage: SearchPage;
  9   |   let articlePage: ArticlePage;
  10  | 
  11  |   test.beforeEach(async ({ page }) => {
  12  |     homePage = new HomePage(page);
  13  |     searchPage = new SearchPage(page);
  14  |     articlePage = new ArticlePage(page);
  15  |     await homePage.navigateToHome();
  16  |   });
  17  | 
  18  |   test('should access search page', async ({ page }) => {
  19  |     await searchPage.navigateToSearch();
  20  | 
  21  |     const isLoaded = await searchPage.isSearchPageLoaded();
  22  |     expect(isLoaded).toBe(true);
  23  |   });
  24  | 
  25  |   test('should perform basic search', async ({ page }) => {
  26  |     await searchPage.navigateToSearch();
  27  |     await searchPage.performSearch('AI');
  28  | 
  29  |     await searchPage.waitForSearchResults();
  30  |     const hasResults = await searchPage.hasSearchResults();
  31  |     expect(hasResults).toBe(true);
  32  |   });
  33  | 
  34  |   test('should display search results with titles', async ({ page }) => {
  35  |     await searchPage.navigateToSearch();
  36  |     await searchPage.performSearch('quantum');
  37  | 
  38  |     const titles = await searchPage.getResultTitles();
  39  |     titles.forEach(title => {
  40  |       expect(title.length).toBeGreaterThan(0);
  41  |     });
  42  |   });
  43  | 
  44  |   test('should show no results for non-existent search', async ({ page }) => {
  45  |     await searchPage.navigateToSearch();
  46  |     await searchPage.performSearch('xyzabc123notreal');
  47  | 
  48  |     await searchPage.waitForSearchResults();
  49  |     const hasNoResults = await searchPage.hasNoResultsMessage();
  50  |     expect(hasNoResults).toBe(true);
  51  |   });
  52  | 
  53  |   test('should navigate to article from search results', async ({ page }) => {
  54  |     await searchPage.navigateToSearch();
  55  |     await searchPage.performSearch('AI');
  56  | 
  57  |     const hasResults = await searchPage.hasSearchResults();
  58  |     if (hasResults) {
  59  |       const resultCount = await searchPage.getSearchResultCount();
  60  |       if (resultCount > 0) {
  61  |         await searchPage.clickFirstResult();
  62  | 
  63  |         const url = await page.url();
  64  |         expect(url).toContain('/article/');
  65  |       }
  66  |     }
  67  |   });
  68  | 
  69  |   test('should maintain search query in input', async ({ page }) => {
  70  |     await searchPage.navigateToSearch();
  71  |     const searchQuery = 'robotics';
  72  |     await searchPage.performSearch(searchQuery);
  73  | 
  74  |     const inputValue = await searchPage.getSearchInputValue();
> 75  |     expect(inputValue).toContain(searchQuery);
      |                        ^ Error: expect(received).toContain(expected) // indexOf
  76  |   });
  77  | 
  78  |   test('should clear search results', async ({ page }) => {
  79  |     await searchPage.navigateToSearch();
  80  |     await searchPage.performSearch('AI');
  81  | 
  82  |     const initialCount = await searchPage.getSearchResultCount();
  83  |     expect(initialCount).toBeGreaterThan(0);
  84  | 
  85  |     await searchPage.clearSearch();
  86  | 
  87  |     // After clearing, should either show all articles or no results
  88  |     const finalCount = await searchPage.getSearchResultCount();
  89  |     // Count might be different from initial (could be showing all, or all matching empty query)
  90  |     expect(typeof finalCount).toBe('number');
  91  |   });
  92  | 
  93  |   test('should handle multiple searches sequentially', async ({ page }) => {
  94  |     await searchPage.navigateToSearch();
  95  | 
  96  |     // Search for first query
  97  |     await searchPage.performSearch('science');
  98  |     const firstResults = await searchPage.getSearchResultCount();
  99  | 
  100 |     // Search for second query
  101 |     await searchPage.performSearch('technology');
  102 |     await searchPage.waitForSearchResults();
  103 |     const secondResults = await searchPage.getSearchResultCount();
  104 | 
  105 |     // Results should update
  106 |     expect(typeof firstResults).toBe('number');
  107 |     expect(typeof secondResults).toBe('number');
  108 |   });
  109 | 
  110 |   test('should be responsive on mobile', async ({ browser }) => {
  111 |     const mobileContext = await browser.newContext({
  112 |       viewport: { width: 375, height: 667 }
  113 |     });
  114 |     const mobilePage = await mobileContext.newPage();
  115 |     const mobileSearch = new SearchPage(mobilePage);
  116 | 
  117 |     await mobileSearch.navigateToSearch();
  118 |     const isLoaded = await mobileSearch.isSearchPageLoaded();
  119 |     expect(isLoaded).toBe(true);
  120 | 
  121 |     // Perform search on mobile
  122 |     await mobileSearch.performSearch('AI');
  123 |     await mobileSearch.waitForSearchResults();
  124 | 
  125 |     const hasResults = await mobileSearch.hasSearchResults();
  126 |     expect(hasResults).toBe(true);
  127 | 
  128 |     // Verify results are readable on mobile
  129 |     const titles = await mobileSearch.getResultTitles();
  130 |     expect(titles.length).toBeGreaterThan(0);
  131 | 
  132 |     await mobileContext.close();
  133 |   });
  134 | 
  135 |   test('should filter search results by category', async ({ page }) => {
  136 |     await searchPage.navigateToSearch();
  137 |     await searchPage.performSearch('');
  138 | 
  139 |     // Try to apply category filter
  140 |     try {
  141 |       await searchPage.filterByCategory('AI');
  142 |       const results = await searchPage.getSearchResultCount();
  143 |       expect(results).toBeGreaterThanOrEqual(0);
  144 |     } catch {
  145 |       // Filter might not be available, that's okay
  146 |       expect(true).toBe(true);
  147 |     }
  148 |   });
  149 | 
  150 |   test('should display result metadata', async ({ page }) => {
  151 |     await searchPage.navigateToSearch();
  152 |     await searchPage.performSearch('AI');
  153 | 
  154 |     const hasResults = await searchPage.hasSearchResults();
  155 |     if (hasResults) {
  156 |       const metadata = await searchPage.getResultMetadata(0);
  157 |       expect(metadata.title).toBeTruthy();
  158 |     }
  159 |   });
  160 | 
  161 |   test('should handle search from home page', async ({ page }) => {
  162 |     await homePage.navigateToHome();
  163 |     await homePage.waitForArticlesToLoad();
  164 | 
  165 |     // Perform search from home page
  166 |     await homePage.searchArticles('quantum');
  167 | 
  168 |     // Verify search was performed
  169 |     const url = await page.url();
  170 |     expect(url).toContain('/search') || expect(url).toContain('?');
  171 | 
  172 |     // Should show results
  173 |     const hasResults = await searchPage.hasSearchResults();
  174 |     expect(hasResults).toBe(true);
  175 |   });
```