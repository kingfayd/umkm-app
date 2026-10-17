import { DollarSign, Users, CreditCard, Activity } from "lucide-react";
import Card, { CardProps, CardContent } from "@/components/Card";
import BarChart from "@/components/ProcurementBarChart";
import ProcurementRecent from "@/components/ProcurementRecent";

const cardData: CardProps[] = [
  {
    id: "1",
    label: "Pengeluaran",
    amount: "$45,231.89",
    discription: "Total pengeluaran bulan ini",
    icon: DollarSign,
  },
  {
    id: "2",
    label: "Pemasukan",
    amount: "+2350",
    discription: "Pemasukan bulan ini",
    icon: Users,
  },
  {
    id: "3",
    label: "Penjualan",
    amount: "+1045",
    discription: "Total penjualan bulan ini",
    icon: CreditCard,
  },
  {
    id: "4",
    label: "Cuan",
    amount: "+18,000,000",
    discription: "Total Cuan bulan ini",
    icon: Activity,
  },
];

export default function Home() {
  return (
    <div className="flex w-full flex-col gap-5">
      <section className="grid w-full grid-cols-1 gap-4 gap-x-8 transition-all sm:grid-cols-2 xl:grid-cols-4">
        {cardData.map((card) => (
          <Card
            key={card.id}
            id={card.id}
            amount={card.amount}
            discription={card.discription}
            icon={card.icon}
            label={card.label}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 transition-all lg:grid-cols-2">
        <CardContent>
          <p className="p-4 font-semibold">Pengadaan</p>
          <BarChart />
        </CardContent>
        <CardContent className="flex justify-between gap-4">
          <section>
            <p>Pengadaan</p>
            <p className="text-sm text-gray-400">Pengadaan terkini bulan ini</p>
          </section>
          <ProcurementRecent />
        </CardContent>
        <CardContent className="flex justify-between gap-4">
          <section>
            <p>Penjualan</p>
            <p className="text-sm text-gray-400">Penjualan terkini bulan ini</p>
          </section>
        </CardContent>
        <CardContent>
          <p className="p-4 font-semibold">Penjualan</p>
        </CardContent>
        <CardContent>
          <p className="p-4 font-semibold">Income Bulanan</p>
        </CardContent>
      </section>
    </div>
  );
}
