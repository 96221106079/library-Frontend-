// ============================================
// LibraryCard.jsx - Individual Library Card
// ============================================
import { useNavigate } from "react-router-dom";
import styles from "./LibraryCard.module.css";

const LibraryCard = ({ library }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.card} onClick={() => navigate(`/library/${library._id}`)}>
      <div className={styles.imageWrapper}>
        <img src={library.image} alt={library.name} className={styles.image} />
        <div className={styles.distanceBadge}>{library.distanceLabel}</div>
      </div>
      <div className={styles.info}>
        <h4 className={styles.name}>{library.name}</h4>
        <p className={styles.address}>{library.address || "Main Street, Library District"}</p>
        <div className={styles.viewBtn}>Browse Collection ➔</div>
      </div>
    </div>
  );
};

export default LibraryCard;
