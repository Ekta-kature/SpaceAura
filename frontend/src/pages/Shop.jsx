import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi, categoriesApi } from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function Shop() {
  const [sp, setSp] = useSearchParams();
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);

  const [filters, setFilters] = useState({
    search:   sp.get('search')   || '',
    category: sp.get('category') || '',
    minPrice: sp.get('minPrice') || '',
    maxPrice: sp.get('maxPrice') || '',
    sort:     sp.get('sort')     || 'createdAt',
    order:    sp.get('order')    || 'desc',
    badge:    sp.get('badge')    || '',
  });

  useEffect(() => { categoriesApi.list().then(({ data }) => setCategories(data.categories || [])); }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await productsApi.list(params);
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {}
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [filters]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="container" style={{ padding:'48px 24px' }}>
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Collection</p>
          <h1 style={s.title}>Shop All Products</h1>
          <p style={s.count}>{total.toLocaleString()} products{filters.category ? ` in ${categories.find(c=>c.slug===filters.category)?.name||''}` : ''}</p>
        </div>
        {/* Search */}
        <div style={s.searchWrap}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5c5852" strokeWidth="1.5" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            className="form-input"
            style={{ paddingLeft:42, width:300 }}
            placeholder="Search products..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>
      </div>

      <div style={s.layout}>
        {/* Sidebar Filters */}
        <aside style={s.sidebar}>
          <div style={s.filterSection}>
            <h4 style={s.filterTitle}>Categories</h4>
            <div style={s.filterList}>
              <button
                onClick={() => setFilter('category','')}
                style={{ ...s.filterItem, ...(filters.category==='' ? s.filterActive : {}) }}
              >All Categories</button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setFilter('category', c.slug)}
                  style={{ ...s.filterItem, ...(filters.category===c.slug ? s.filterActive : {}) }}
                >
                  {c.name}
                  <span style={s.filterCount}>{c._count?.products||0}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={s.filterSection}>
            <h4 style={s.filterTitle}>Price Range</h4>
            <div style={{ display:'flex', gap:8 }}>
              <input className="form-input" placeholder="₹ Min" style={{ fontSize:13 }} value={filters.minPrice} onChange={e=>setFilter('minPrice',e.target.value)} />
              <input className="form-input" placeholder="₹ Max" style={{ fontSize:13 }} value={filters.maxPrice} onChange={e=>setFilter('maxPrice',e.target.value)} />
            </div>
          </div>

          <div style={s.filterSection}>
            <h4 style={s.filterTitle}>Badge</h4>
            {['','New','Bestseller','Sale','Limited'].map(b => (
              <button key={b} onClick={() => setFilter('badge',b)} style={{ ...s.filterItem, ...(filters.badge===b ? s.filterActive : {}) }}>
                {b || 'All'}
              </button>
            ))}
          </div>

          <div style={s.filterSection}>
            <h4 style={s.filterTitle}>Sort By</h4>
            {[['createdAt,desc','Newest'],['price,asc','Price: Low to High'],['price,desc','Price: High to Low'],['rating,desc','Top Rated']].map(([val,label]) => {
              const [sort,order] = val.split(',');
              return (
                <button key={val} onClick={()=>{ setFilter('sort',sort); setFilter('order',order); }} style={{ ...s.filterItem, ...(filters.sort===sort&&filters.order===order ? s.filterActive : {}) }}>
                  {label}
                </button>
              );
            })}
          </div>

          {Object.values(filters).some(Boolean) && (
            <button className="btn btn-ghost btn-sm" style={{ width:'100%', marginTop:8 }}
              onClick={() => setFilters({ search:'',category:'',minPrice:'',maxPrice:'',sort:'createdAt',order:'desc',badge:'' })}>
              Clear All Filters
            </button>
          )}
        </aside>

        {/* Product Grid */}
        <div style={{ flex:1 }}>
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
              {[...Array(6)].map((_,i) => <div key={i} style={s.skeleton} />)}
            </div>
          ) : products.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>◎</div>
              <h3 style={s.emptyTitle}>No products found</h3>
              <p style={s.emptySub}>Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <>
              <div style={s.grid}>
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {pages > 1 && (
                <div style={s.pagination}>
                  <button className="btn btn-outline btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Previous</button>
                  <span style={s.pageInfo}>Page {page} of {pages}</span>
                  <button className="btn btn-outline btn-sm" disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  header:   { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:40, gap:24, flexWrap:'wrap' },
  eyebrow:  { fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'#c9a96e', marginBottom:8 },
  title:    { fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'#f5f0eb', fontWeight:400 },
  count:    { fontSize:13, color:'#5c5852', marginTop:4 },
  searchWrap: { position:'relative' },

  layout:   { display:'flex', gap:40, alignItems:'flex-start' },
  sidebar:  { width:240, flexShrink:0, position:'sticky', top:88 },
  filterSection: { marginBottom:32 },
  filterTitle:   { fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:'#9e9890', marginBottom:12, fontWeight:600 },
  filterList:    { display:'flex', flexDirection:'column', gap:2 },
  filterItem:    { background:'none', border:'none', textAlign:'left', padding:'8px 12px', fontSize:13, color:'#5c5852', cursor:'pointer', borderRadius:4, display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all 0.15s' },
  filterActive:  { background:'rgba(201,169,110,0.1)', color:'#c9a96e' },
  filterCount:   { fontSize:11, color:'#3a3a3a' },

  grid:     { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 },
  skeleton: { height:380, background:'#111', borderRadius:8, animation:'pulse 1.5s ease infinite alternate' },
  empty:    { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 40px', textAlign:'center' },
  emptyIcon:  { fontSize:48, color:'#2a2a2a', marginBottom:20 },
  emptyTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:'#f5f0eb', marginBottom:8 },
  emptySub:   { color:'#5c5852', fontSize:14 },
  pagination: { display:'flex', alignItems:'center', justifyContent:'center', gap:24, marginTop:48 },
  pageInfo:   { fontSize:13, color:'#5c5852' },
};
