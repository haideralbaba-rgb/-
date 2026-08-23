import { AuthProvider } from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import Header from "./components/Header";
import Hero from "./components/Hero";
import BrandStatement from "./components/BrandStatement";
import FeaturedDishes from "./components/FeaturedDishes";
import CraftSection from "./components/CraftSection";
import Story from "./components/Story";
import MenuSection from "./components/MenuSection";
import SocialProof from "./components/SocialProof";
import Gallery from "./components/Gallery";
import LocationSection from "./components/LocationSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import CartBar from "./components/CartBar";
import OrderDrawer from "./components/OrderDrawer";
import AuthModal from "./components/AuthModal";
import ChatWidget from "./components/ChatWidget";
import RestaurantDashboard from "./components/RestaurantDashboard";

export default function App() {
  const isDashboard = window.location.pathname.replace(/\/$/, "") === "/dashboard";

  return (
    <AuthProvider>
      {isDashboard ? (
        <RestaurantDashboard />
      ) : (
        <OrderProvider>
          <div className="relative min-h-screen bg-bg text-ivory selection:bg-gold selection:text-bg">
            <Header />
            <main>
              <Hero />
              <BrandStatement />
              <FeaturedDishes />
              <CraftSection />
              <Story />
              <MenuSection />
              <SocialProof />
              <Gallery />
              <LocationSection />
              <CTASection />
            </main>
            <Footer />
            <CartBar />
            <OrderDrawer />
            <AuthModal />
            <ChatWidget />
          </div>
        </OrderProvider>
      )}
    </AuthProvider>
  );
}
