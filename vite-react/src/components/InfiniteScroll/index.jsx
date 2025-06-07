import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import "./index.css";

const InfiniteScroll = () => {
  const skipRef = useRef(0);
  const loading = useRef(false);
  const [posts, setPosts] = useState([]);
  // const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async ({ skip = 0, limit = 20 }) => {
    // if (loading) return false;

    // setLoading(true);
    const res = await axios.get(
      `https://dummyjson.com/products?limit=${limit}&skip=${skip}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const { products } = res.data;
    setPosts((posts) => [...posts, ...products]);
    skipRef.current = skipRef.current + limit;

    // setLoading(false);
  }, []);

  useEffect(() => {
    console.log("useEffect 1===========");
    fetchPosts({ skip: skipRef.current });
  }, []);

  useEffect(() => {
    const handleScroll = async () => {
      if (loading.current) return false;

      const screenHeight = window.innerHeight;
      const tillScrolled = window.scrollY;
      const totalScrollingHeight = document.body.scrollHeight;

      const nearBottom =
        screenHeight + tillScrolled > totalScrollingHeight - 500;
      if (nearBottom && !loading.current) {
        loading.current = true;
        await fetchPosts({ skip: skipRef.current });
        loading.current = false;
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [fetchPosts]);
  /**
   * React's useEffect has a simple contract:
   *  | “Declare all variables and functions used inside the effect in the dependency array.”
   */

  return (
    <>
      <div className="container">
        {posts?.map((post) => (
          <div key={post.id} className="card">
            <div className="card-image">
              <div className="image-container">{post?.id}</div>
            </div>
            <div className="card-body">
              <p className="card-title">{post.title}</p>
              <div className="card-descriptions-1">
                <p>
                  Brand: <span>{post.brand}</span>
                </p>
                <p>
                  Category: <span>{post.category}</span>
                </p>
                <p>
                  SKU: <span>{post.sku}</span>
                </p>
              </div>
            </div>
            <div className="card-action"></div>
          </div>
        ))}
      </div>
    </>
  );
};

export default InfiniteScroll;
