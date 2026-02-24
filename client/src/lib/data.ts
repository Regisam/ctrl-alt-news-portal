// CTRL + ALT News — Content Data
// All articles available in PT-BR and EN-UK

export type Category = 'AI' | 'SCIENCE' | 'ROBOTICS' | 'GADGETS';

export interface Article {
  id: number;
  title: { en: string; pt: string };
  excerpt: { en: string; pt: string };
  category: Category;
  author: string;
  date: string;
  readTime: string;
  views: string;
  image: string;
  featured?: boolean;
}

export interface GadgetProduct {
  id: number;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  image: string;
  amazonUrl: string;
  badge: string;
}

// Hero image
export const HERO_IMAGE = "https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-1_1771963524000_na1fn_aGVyby1xdWFudHVtLWFp.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOEU0c3Jaa2Vqam9rRGtXUFBnWkFJZy9zYW5kYm94LzJHTjRlclpVTHhjMkM2Zk1LczA5S0staW1nLTFfMTc3MTk2MzUyNDAwMF9uYTFmbl9hR1Z5YnkxeGRXRnVkSFZ0TFdGcC5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=e9h0qfNhYpyGQKYOz6u8rbOS~z9y4crjdgNUZhAPJnXgAQhpmshvjSqCQij7uePKW35A3QSa3mYc7sfkqCiKMuK9Jxu-h4UHnJWA1RqjpIkvVncVW05Nu6gtHzWRc7Dof0dwM9Df65YCpNZoOUB~Ve1RXiBnamMejGkNcQvvzWwWaOzft6ECDhrgZ~5iE3IrUeRIGZcUwAA8sdjnOQEMicC7xdaoyaP3XnQyAx4iZRfkv5Ir7BeLrdrxM5WdBDnhBT7uc~G~s-CMXIh64qwECqseUElblxxGNemz97hmfE9ZXuN04NSdXfNQyhQpEfPcMTUe3H5WDO2eQEFd0gFZXQ__";

export const AI_IMAGE = "https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-2_1771963521000_na1fn_YWktbmV1cmFsLWFydGljbGU.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOEU0c3Jaa2Vqam9rRGtXUFBnWkFJZy9zYW5kYm94LzJHTjRlclpVTHhjMkM2Zk1LczA5S0staW1nLTJfMTc3MTk2MzUyMTAwMF9uYTFmbl9ZV2t0Ym1WMWNtRnNMV0Z5ZEdsamJHVS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=TvxytHYy5X14gwjtAK3Wx3yq1BtMP31x06iFWyZC76qLMWxoVQFaFmoPlxEkWF4Bp-B0lEif3GPZUbX7IuNrzkaPdsPvh7jgtAmpgQ~3mfQPxx6U6BFTwYnJ1fsXMG8wT2SXPndVuwghp9MHPZ9M9OUT-JxncttDiWRMr1lQKx5uPEM8jv16qBybNoRFIUdwCbY98WrmlJABLTXhQWBQYbm2ZQaYEIe-0DTA6uV9ENh0O225G8qSMgu~JRtCGrmcPITYdcEwSQ182~w1e7EJeNX961jXVQ2KxfNJ41T7pBNeGGRXJ6HoEjOksgshsK8tFSMj2J17jLRbr6OWMqpPKw__";

export const SCIENCE_IMAGE = "https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-3_1771963525000_na1fn_c2NpZW5jZS1xdWFudHVtLWFydGljbGU.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOEU0c3Jaa2Vqam9rRGtXUFBnWkFJZy9zYW5kYm94LzJHTjRlclpVTHhjMkM2Zk1LczA5S0staW1nLTNfMTc3MTk2MzUyNTAwMF9uYTFmbl9jMk5wWlc1alpTMXhkV0Z1ZEhWdExXRnlkR2xqYkdVLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ZA1a26Kl3zdzOlYcBj9PO67~T1dJMutHrLdlu050EY3Hhpj-5GK3KX14eAqxq-85lceWkH5cDO7t3VxVYopM6ESLljZ4PzCX5y0yMyknDOIEnOIrvxPW72-Hgj9oqp-5F37-dDXEXLBsmjjaEGOk8xSHAPVIu4W~8eKZ1JL1v6f-36eEaT-OLcCJ6P~Agv7Hdmnyap699oDLAA5RpDCmlRLErNLKMLIY~ag8HIUlK3E7oyaiwkw3AJy6q35nVIUuYXQFUN7IGGBiB5AJ1-9vbbioAqs6GoIOzGZiTjb3DurNJUo2Xcqe3EJnKM2mm0byo~8sHgZ1Zcge9YNWGCRRTw__";

export const ROBOTICS_IMAGE = "https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-4_1771963533000_na1fn_cm9ib3RpY3MtYXJ0aWNsZQ.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOEU0c3Jaa2Vqam9rRGtXUFBnWkFJZy9zYW5kYm94LzJHTjRlclpVTHhjMkM2Zk1LczA5S0staW1nLTRfMTc3MTk2MzUzMzAwMF9uYTFmbl9jbTlpYjNScFkzTXRZWEowYVdOc1pRLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=LeMa4DlcN0DfxYpWJpRzndnFHD9wuK~Lgg8S-Zw1oajeRgIeN5SqqV40g5WpTxClkyZOhzza5ju5tgCGtDzaNXlEwNrBzWcpg0l4lQYwEzxM501wLSWEij~CDdicHTq8RRRX53Sn-QwnHNJyytVyPweEb7oi7AMjgR3o-YHFmfPh-WNRaRCbxdSRLLqfnBOdRM93tCITg8zV8q7ggRJ94KW2o4Z24o8AJbz4Z6vlGLm60wppElEU300BoLZaMxKs2m5jY9MeTpCCL6tDr8UO2LRyQVbBqMStPx4sH3fgBd1-CDCepdf-0n1TY7bedMTHbKUfLWr0q~ZXkD9vHyZVCQ__";

export const CHIP_IMAGE = "https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/vULyvGhN0DnnOvFBohsJWy-img-4_1771963596000_na1fn_dHJlbmRpbmctYWktY2hpcA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOEU0c3Jaa2Vqam9rRGtXUFBnWkFJZy9zYW5kYm94L3ZVTHl2R2hOMERubk92RkJvaHNKV3ktaW1nLTRfMTc3MTk2MzU5NjAwMF9uYTFmbl9kSEpsYm1ScGJtY3RZV2t0WTJocGNBLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=YB4snizEf4oEoYObp9Lv3o76sgfjp-0YxhfYJRIYELhzaNkg0vzRPx5Ub23QR5YNiBfe~Kh~volCzQ6bZDQjm17~W1X7YhuyO1JAa0Byy~oCqwcz6ficXq1dJty8x468uUm1mX2dL~3zQG1IoxfGIM~9g8YKVAS7Yp2i3jCW2JmbNOxG8EcBiwXLYXsl4CaVZYpnlwuQTimUmUID42Z2fh6TEBCP0z-bo2nHUtUCnhKul8UUVvgScoAGZQxJqxkb~shxjZyQ43oQ2L69jgvxcDXJy~o6jckPZlVgEae8mQzcecu2HBRtLc7p0Ci-VVD~MpZy~SYqTMYFo7CHT9SWwA__";

export const LOGO1_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663215628989/PEwZctpmmIIArYwD.png";
export const LOGO2_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663215628989/SBpTvnoKHaINngeZ.png";

export const SMARTWATCH_IMAGE = "https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-5_1771963529000_na1fn_Z2FkZ2V0cy1zbWFydHdhdGNo.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOEU0c3Jaa2Vqam9rRGtXUFBnWkFJZy9zYW5kYm94LzJHTjRlclpVTHhjMkM2Zk1LczA5S0staW1nLTVfMTc3MTk2MzUyOTAwMF9uYTFmbl9aMkZrWjJWMGN5MXpiV0Z5ZEhkaGRHTm8uanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=SqJU68E~A1mtVc8nFGIbJ6DDilSYTOcMss2WzKf4ivCFihUE3DYH2N2aZREegtHqQIH0zMaetjuK5SSYk2oDwGZlLEJ2rtyd2WV2wgYhh2vGOdnxgsyjcrzYPWRBfNS0Umq22C0zbY8y9iPeIadW~sLnlfIgRO1Yg7~lEvVHptjI4KehPJKO9DIkEuekKcKQVlruXuCHmea4TfFtQu72CXrrQd2wMBSWRCCOBqykwoi~~EAm~ZsddJj-5Q0IHj1Cm2gQi-KDJFnOc4QY65zYh1PA09TatCeooRc3B4wPhb1xYMKMPHhPbNH2yKU7ScMdWvokSyhnbXgI88Ota8kj5g__";

export const DRONE_IMAGE = "https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/vULyvGhN0DnnOvFBohsJWy-img-1_1771963601000_na1fn_Z2FkZ2V0cy1kcm9uZQ.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOEU0c3Jaa2Vqam9rRGtXUFBnWkFJZy9zYW5kYm94L3ZVTHl2R2hOMERubk92RkJvaHNKV3ktaW1nLTFfMTc3MTk2MzYwMTAwMF9uYTFmbl9aMkZrWjJWMGN5MWtjbTl1WlEuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=coIpAxIIFxExEi2Px~bEQlSv0KV4gghgNhi4KcBTUFJf8ZfO1WljiZ0g3h3OiFRrZmkZxL4O~MC8vxhelLalTVaMXcjgjBpphJu~zrx0zEzh2AITKN9KKJ9lu6sW3~ox8j~zfuZ~8a-0cJCEabLaIZsnY0OsMBK76qIsi2Q53Wzx4XkLKWyukG2vaarHYcPkwiLp0ydu175nGJoL~S17SKkJKA2LEnWiYjNckX1piHM~6KrxkJlTHUUfRxlNjEs09XTSqg0V3DcjQkDE3d7U3CvZthS97k93XrjJGPqLXRJY04bCPgJMohk1wda7TRKxRIE5QP7EpQMmGv432nuyYg__";

export const EARBUDS_IMAGE = "https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/vULyvGhN0DnnOvFBohsJWy-img-2_1771963602000_na1fn_Z2FkZ2V0cy1lYXJidWRz.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOEU0c3Jaa2Vqam9rRGtXUFBnWkFJZy9zYW5kYm94L3ZVTHl2R2hOMERubk92RkJvaHNKV3ktaW1nLTJfMTc3MTk2MzYwMjAwMF9uYTFmbl9aMkZrWjJWMGN5MWxZWEppZFdSei5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=EXAtUx7VpknG12~FX2Sf8XFhf~pjA78IuFKOy8HzdWoY0pnA2bZdjTW7TeZn2b2UPP54YZccuH5MXU7w7Pp4ffWYO3dT~bKrqVFAZ9Nbiurg20quxrWRz79gXOh2aAenFSErBunBPN8udQL2XsBqkhMzkTa3S-dxqZTNSbXxdqNdxqmRvZLBV8rvNsZaMSMBKSoFGtoUnMgn6aJgqXJivDYs1xEYilYdTPMwSlIFkcRBDkROmk8j~tE6SDmA-cVFuubCQvEfzcNScQgLR00PGeXOxgjC4G4n5f7cgfuUGkn37gMWlQMVcaAkuHolhel4ybfhJWrPrhYEIKQrLUR0oA__";

export const LAPTOP_IMAGE = "https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/vULyvGhN0DnnOvFBohsJWy-img-3_1771963596000_na1fn_Z2FkZ2V0cy1sYXB0b3A.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOEU0c3Jaa2Vqam9rRGtXUFBnWkFJZy9zYW5kYm94L3ZVTHl2R2hOMERubk92RkJvaHNKV3ktaW1nLTNfMTc3MTk2MzU5NjAwMF9uYTFmbl9aMkZrWjJWMGN5MXNZWEIwYjNBLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=eUmrfZeBalt52iiXJQudFKFwf7PCvLYxCMbbbNI9IRUUhrU3BZbEZRWefFiTlP3O11Q93JaS1lM-g0Sye3XZExugduGOWTEZ7bAeCP-AoFMDV8RioYzFZhtXMBHgfl8qkR0aMhjdBmqVwlYNG47XSg8Xh5QhrA94P12t1Jxgtzd-A7iTStXNyH56WYVltDGM5gUTkY5k3L5UelmSsS9vX~joPduuCWC0s1PhP~dv3HK8s0i1scmz2cGU3DOGrJwsUmE0iFZd33910Dusu0sgaLkR1WgtpXmwXS7Lcz-Y1Lq8UDWA8iSK3tqjw828P1X~Zs-nhr5r-PGwSWlRTw9lLQ__";

export const trendingArticles = [
  {
    id: 1,
    title: { en: "GPT-5 Breaks Every Benchmark: The New Era of Reasoning AI", pt: "GPT-5 Quebra Todos os Benchmarks: A Nova Era da IA de Raciocínio" },
    excerpt: { en: "OpenAI's latest model demonstrates unprecedented logical reasoning capabilities, surpassing human performance on complex multi-step problems.", pt: "O mais recente modelo da OpenAI demonstra capacidades de raciocínio lógico sem precedentes, superando o desempenho humano em problemas complexos de múltiplas etapas." },
    category: 'AI' as Category,
    author: "Alex Chen",
    date: "Feb 24, 2026",
    readTime: "5 min",
    views: "48.2K",
    image: AI_IMAGE,
  },
  {
    id: 2,
    title: { en: "Quantum Frontiers: Inside the Next-Gen Lab Reshaping Physics", pt: "Fronteiras Quânticas: Dentro do Laboratório de Próxima Geração que Está Reformulando a Física" },
    excerpt: { en: "Scientists at CERN have achieved a breakthrough in quantum entanglement stability, opening doors to practical quantum computing at room temperature.", pt: "Cientistas do CERN alcançaram um avanço na estabilidade do emaranhamento quântico, abrindo portas para a computação quântica prática em temperatura ambiente." },
    category: 'SCIENCE' as Category,
    author: "Dr. Maria Santos",
    date: "Feb 23, 2026",
    readTime: "7 min",
    views: "31.5K",
    image: SCIENCE_IMAGE,
  },
  {
    id: 3,
    title: { en: "Boston Dynamics' Atlas 3.0: The Robot That Thinks While It Moves", pt: "Atlas 3.0 da Boston Dynamics: O Robô Que Pensa Enquanto Se Move" },
    excerpt: { en: "The latest iteration of Atlas combines real-time neural processing with physical agility, enabling autonomous decision-making in unstructured environments.", pt: "A mais recente iteração do Atlas combina processamento neural em tempo real com agilidade física, permitindo tomada de decisão autônoma em ambientes não estruturados." },
    category: 'ROBOTICS' as Category,
    author: "James Wright",
    date: "Feb 22, 2026",
    readTime: "6 min",
    views: "27.8K",
    image: ROBOTICS_IMAGE,
  },
];

export const popularArticles = [
  {
    id: 4,
    title: { en: "AI Chip Wars: NVIDIA vs. AMD vs. Intel in 2026", pt: "Guerra dos Chips de IA: NVIDIA vs. AMD vs. Intel em 2026" },
    category: 'AI' as Category,
    date: "Feb 24, 2026",
    views: "52.1K",
    image: CHIP_IMAGE,
  },
  {
    id: 5,
    title: { en: "Dark Matter Detected? Scientists Report Anomalous Signal", pt: "Matéria Escura Detectada? Cientistas Relatam Sinal Anômalo" },
    category: 'SCIENCE' as Category,
    date: "Feb 23, 2026",
    views: "38.9K",
    image: SCIENCE_IMAGE,
  },
  {
    id: 6,
    title: { en: "Humanoid Robots Enter the Workforce: 1 Million Units Deployed", pt: "Robôs Humanoides Entram na Força de Trabalho: 1 Milhão de Unidades Implantadas" },
    category: 'ROBOTICS' as Category,
    date: "Feb 22, 2026",
    views: "29.4K",
    image: ROBOTICS_IMAGE,
  },
];

export const gadgetProducts = [
  {
    id: 1,
    name: "NexWatch Pro X1",
    category: "Smartwatch",
    rating: 4.8,
    reviews: 2847,
    image: SMARTWATCH_IMAGE,
    amazonUrl: "https://amazon.com",
    badge: "Editor's Pick",
  },
  {
    id: 2,
    name: "AeroBot Carbon FPV",
    category: "Racing Drone",
    rating: 4.7,
    reviews: 1923,
    image: DRONE_IMAGE,
    amazonUrl: "https://amazon.com",
    badge: "Best Seller",
  },
  {
    id: 3,
    name: "SoundCore Ultra TWS",
    category: "Wireless Earbuds",
    rating: 4.9,
    reviews: 5612,
    image: EARBUDS_IMAGE,
    amazonUrl: "https://amazon.com",
    badge: "Top Rated",
  },
  {
    id: 4,
    name: "Titan Gaming Laptop G7",
    category: "Gaming Laptop",
    rating: 4.6,
    reviews: 3341,
    image: LAPTOP_IMAGE,
    amazonUrl: "https://amazon.com",
    badge: "Hot Deal",
  },
];
