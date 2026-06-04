// ============================================
// LibrarySection.jsx - Nearby Libraries Row
// ============================================
import LibraryCard from "./LibraryCard";
import styles from "./LibrarySection.module.css";

const LibrarySection = ({ libraries, loading }) => {
  const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
  const isLibrarian = userInfo.role === "librarian";

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {isLibrarian ? "Network of Institutions" : "Institutions Near You"}
        </h3>
        <span className={styles.badge}>{libraries.length} Libraries</span>
      </div>

      <div className={styles.scrollContainer}>
        {loading ? (
          <div className={styles.skeleton}>Finding partners...</div>
        ) : libraries.length === 0 ? (
          <div className={styles.empty}>No partner libraries nearby yet.</div>
        ) : (
          libraries.map((lib) => <LibraryCard key={lib._id} library={lib} />)
        )}
      </div>
    </div>
  );
};

export default LibrarySection;
