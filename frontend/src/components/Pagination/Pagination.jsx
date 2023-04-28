import "./Pagination.css";

export default function Pagination({ page, totalPage, setPage = () => {} }) {
	return (
		<div className="pagination">
			{page > 1 && <i onClick={() => setPage(page - 1)}>{"<"}</i>}
			{page > 2 && <a onClick={() => setPage(1)}>1</a>}
			{page > 3 && <span>...</span>}
			{page > 1 && <a onClick={() => setPage(page - 1)}>{page - 1}</a>}
			<a className="activePage" onClick={() => setPage(page)}>
				{page}
			</a>
			{page < totalPage && <a onClick={() => setPage(page + 1)}>{page + 1}</a>}
			{page < totalPage - 2 && <span>...</span>}
			{page < totalPage - 1 && <a onClick={() => setPage(totalPage)}>{totalPage}</a>}
			{page < totalPage && <i onClick={() => setPage(page + 1)}>{">"}</i>}
		</div>
	);
}
