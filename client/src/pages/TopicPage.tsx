import { useState } from 'react';
import { useRoute } from 'wouter';
import { ArrowLeft, Users, TrendingUp, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';

interface TopicArticle {
  id: number;
  title: { en: string; pt: string };
  category: string;
  image: string;
  views: number;
  relevanceScore: number;
}

interface TopicData {
  topicId: string;
  topicName: string;
  description: string;
  adoptionProbability: number;
  similarUserCount: number;
  articles: TopicArticle[];
}

const mockTopicsData: Record<string, TopicData> = {
  'quantum-computing': {
    topicId: 'quantum-computing',
    topicName: 'Quantum Computing',
    description: {
      en: 'Exploring quantum computing breakthroughs, quantum algorithms, and practical quantum applications.',
      pt: 'Explorando avanços em computação quântica, algoritmos quânticos e aplicações práticas.',
    } as any,
    adoptionProbability: 0.82,
    similarUserCount: 234,
    articles: [
      {
        id: 201,
        title: {
          en: 'Google Quantum Chip Breakthrough',
          pt: 'Avanço do Chip Quântico do Google',
        },
        category: 'AI',
        image: 'https://images.unsplash.com/photo-1635539387789-e41bb1b1e7df?w=400',
        views: 15420,
        relevanceScore: 0.95,
      },
      {
        id: 202,
        title: {
          en: 'IBM Quantum Network Expands',
          pt: 'Rede Quântica IBM se Expande',
        },
        category: 'Science',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        views: 12340,
        relevanceScore: 0.88,
      },
      {
        id: 203,
        title: {
          en: 'Quantum Error Correction Advances',
          pt: 'Avanços em Correção de Erros Quânticos',
        },
        category: 'Science',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
        views: 8920,
        relevanceScore: 0.82,
      },
    ],
  },
  'neural-networks': {
    topicId: 'neural-networks',
    topicName: 'Neural Networks',
    description: {
      en: 'Deep learning, neural network architectures, training techniques, and real-world applications.',
      pt: 'Deep learning, arquiteturas de redes neurais, técnicas de treinamento e aplicações práticas.',
    } as any,
    adoptionProbability: 0.78,
    similarUserCount: 189,
    articles: [
      {
        id: 204,
        title: {
          en: 'Transformer Architecture Improvements',
          pt: 'Melhorias na Arquitetura Transformer',
        },
        category: 'AI',
        image: 'https://images.unsplash.com/photo-1639149888905-46e128612e61?w=400',
        views: 18560,
        relevanceScore: 0.93,
      },
      {
        id: 205,
        title: {
          en: 'ConvNets vs Vision Transformers',
          pt: 'ConvNets vs Vision Transformers',
        },
        category: 'AI',
        image: 'https://images.unsplash.com/photo-1677442d019cecf8f1370b5ebc51218e4b60625f?w=400',
        views: 14230,
        relevanceScore: 0.87,
      },
    ],
  },
  'space-exploration': {
    topicId: 'space-exploration',
    topicName: 'Space Exploration',
    description: {
      en: 'Mars missions, satellite technology, space agencies, and the future of human space exploration.',
      pt: 'Missões a Marte, tecnologia de satélites, agências espaciais e o futuro da exploração espacial.',
    } as any,
    adoptionProbability: 0.65,
    similarUserCount: 156,
    articles: [
      {
        id: 206,
        title: {
          en: 'SpaceX Starship Progress',
          pt: 'Progresso da Starship da SpaceX',
        },
        category: 'Robotics',
        image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400',
        views: 22100,
        relevanceScore: 0.91,
      },
      {
        id: 207,
        title: {
          en: 'NASA Artemis Moon Landing Plans',
          pt: 'Planos de Pouso Lunar da NASA Artemis',
        },
        category: 'Science',
        image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400',
        views: 19800,
        relevanceScore: 0.89,
      },
    ],
  },
};

export default function TopicPage() {
  const [match, params] = useRoute('/topic/:topicId');
  const [isFollowing, setIsFollowing] = useState(false);
  const lang = (localStorage.getItem('language') as 'en' | 'pt') || 'en';

  const topicData = match && params?.topicId ? mockTopicsData[params.topicId] : null;

  const handleFollowTopic = () => {
    setIsFollowing(!isFollowing);
    if (!isFollowing) {
      toast.success(
        lang === 'en'
          ? `Following topic: ${topicData?.topicName}`
          : `Seguindo tópico: ${topicData?.topicName}`
      );
    } else {
      toast.success(
        lang === 'en'
          ? `Unfollowed topic: ${topicData?.topicName}`
          : `Deixou de seguir tópico: ${topicData?.topicName}`
      );
    }
  };

  if (!match || !topicData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/">
            <button className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
              <ArrowLeft size={20} />
              {lang === 'en' ? 'Back' : 'Voltar'}
            </button>
          </Link>
          <div className="text-center py-20">
            <p className="text-gray-400">{lang === 'en' ? 'Topic not found' : 'Tópico não encontrado'}</p>
          </div>
        </div>
      </div>
    );
  }

  const description = typeof topicData.description === 'string'
    ? topicData.description
    : topicData.description[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6">
              <ArrowLeft size={20} />
              {lang === 'en' ? 'Back' : 'Voltar'}
            </button>
          </Link>

          <div className="flex justify-between items-start gap-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{topicData.topicName}</h1>
              <p className="text-gray-400 text-lg">{description}</p>
            </div>

            <button
              onClick={handleFollowTopic}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                isFollowing
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30'
                  : 'bg-cyan-500 text-white hover:bg-cyan-600'
              }`}
            >
              {isFollowing ? (
                <>
                  <BookmarkCheck size={18} />
                  {lang === 'en' ? 'Following' : 'Seguindo'}
                </>
              ) : (
                <>
                  <BookmarkPlus size={18} />
                  {lang === 'en' ? 'Follow Topic' : 'Seguir Tópico'}
                </>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
              <TrendingUp size={24} className="text-cyan-400" />
              <div>
                <p className="text-gray-400 text-sm">{lang === 'en' ? 'Adoption Rate' : 'Taxa de Adoção'}</p>
                <p className="text-2xl font-bold">{Math.round(topicData.adoptionProbability * 100)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
              <Users size={24} className="text-pink-400" />
              <div>
                <p className="text-gray-400 text-sm">{lang === 'en' ? 'Similar Users' : 'Usuários Similares'}</p>
                <p className="text-2xl font-bold">{topicData.similarUserCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-8">
          {lang === 'en' ? 'Related Articles' : 'Artigos Relacionados'}
        </h2>

        <div className="grid gap-6">
          {topicData.articles.map((article) => (
            <Link key={article.id} href={`/article/${article.id}`}>
              <div className="group cursor-pointer bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all border border-white/10 hover:border-white/20">
                <div className="flex gap-6 p-6">
                  <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title[lang]}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
                        {article.category}
                      </span>
                      <span className="text-gray-400 text-sm flex items-center gap-1">
                        👁 {article.views.toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                      {article.title[lang]}
                    </h3>

                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-400 to-pink-400 h-2 rounded-full"
                          style={{ width: `${article.relevanceScore * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-sm">
                        {lang === 'en' ? 'Relevance' : 'Relevância'}: {Math.round(article.relevanceScore * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/40 transition-all">
                      <ArrowLeft size={16} className="text-cyan-400 rotate-180" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
