import Link from "next/link";

const Navbar = () => {
  return (
    <header className="flex items-center justify-between p-4">
      <h1 className="text-2xl font-bold">
        Key<span className="text-blue-500">vo</span>
      </h1>
      <nav className="flex gap-6">
        <Link href={"/"}>Leaderboard</Link>
        <Link href={"/"}>Friends</Link>
        <Link href={"/login"}>Profile</Link>
      </nav>
    </header>
  );
};

export default Navbar;
