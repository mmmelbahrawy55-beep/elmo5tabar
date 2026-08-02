import HomePage from './homepage';

export default function LocaleHomePage() {
  return <HomePage />;
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  return {
    title: 'المختبر - Al Mokhtabar',
    description: 'منصة التحاليل الطبية الأولى في مصر',
  };
}
